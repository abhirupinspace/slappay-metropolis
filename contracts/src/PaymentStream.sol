// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title PaymentStream
/// @notice Fully-funded linear streams. Sender deposits `maxAmount` upfront; it accrues to the
///         recipient at `ratePerSecond` from `startTime` until the deposit is exhausted.
contract PaymentStream is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Stream {
        address sender;
        address recipient;
        address token;
        uint256 ratePerSecond; // token base units per second
        uint64 startTime;
        uint64 endTime; // startTime + maxAmount / ratePerSecond (rounded up)
        uint256 maxAmount; // total deposited
        uint256 withdrawn;
        bool cancelled;
        string memo;
    }

    uint256 public nextId = 1;
    mapping(uint256 => Stream) private _streams;

    event StreamCreated(
        uint256 indexed id,
        address indexed sender,
        address indexed recipient,
        address token,
        uint256 ratePerSecond,
        uint64 startTime,
        uint64 endTime,
        uint256 maxAmount,
        string memo
    );
    event StreamWithdrawn(uint256 indexed id, address indexed recipient, uint256 amount);
    event StreamCancelled(uint256 indexed id, uint256 paidToRecipient, uint256 refundedToSender);

    error InvalidRecipient();
    error InvalidRate();
    error InvalidAmount();
    error InvalidStartTime();
    error NotRecipient();
    error NotSender();
    error AlreadyCancelled();
    error NothingToWithdraw();
    error NotFound();

    /// @notice Create and fully fund a stream. Caller must have approved `maxAmount` of `token`.
    /// @param startTime 0 means "now".
    function create(
        address recipient,
        address token,
        uint256 ratePerSecond,
        uint64 startTime,
        uint256 maxAmount,
        string calldata memo
    ) external nonReentrant returns (uint256 id) {
        if (recipient == address(0) || recipient == msg.sender) revert InvalidRecipient();
        if (ratePerSecond == 0) revert InvalidRate();
        if (maxAmount == 0 || maxAmount < ratePerSecond) revert InvalidAmount();
        if (startTime == 0) startTime = uint64(block.timestamp);
        if (startTime < block.timestamp) revert InvalidStartTime();

        uint256 duration = (maxAmount + ratePerSecond - 1) / ratePerSecond; // ceil
        uint64 endTime = uint64(uint256(startTime) + duration);

        id = nextId++;
        _streams[id] = Stream({
            sender: msg.sender,
            recipient: recipient,
            token: token,
            ratePerSecond: ratePerSecond,
            startTime: startTime,
            endTime: endTime,
            maxAmount: maxAmount,
            withdrawn: 0,
            cancelled: false,
            memo: memo
        });

        IERC20(token).safeTransferFrom(msg.sender, address(this), maxAmount);

        emit StreamCreated(id, msg.sender, recipient, token, ratePerSecond, startTime, endTime, maxAmount, memo);
    }

    /// @notice Recipient withdraws everything accrued so far.
    function withdraw(uint256 id) external nonReentrant returns (uint256 amount) {
        Stream storage s = _get(id);
        if (msg.sender != s.recipient) revert NotRecipient();
        amount = withdrawable(id);
        if (amount == 0) revert NothingToWithdraw();
        s.withdrawn += amount;
        IERC20(s.token).safeTransfer(s.recipient, amount);
        emit StreamWithdrawn(id, s.recipient, amount);
    }

    /// @notice Sender stops the stream: recipient gets what has accrued, sender gets the rest.
    function cancel(uint256 id) external nonReentrant {
        Stream storage s = _get(id);
        if (msg.sender != s.sender) revert NotSender();
        if (s.cancelled) revert AlreadyCancelled();

        uint256 owed = withdrawable(id);
        uint256 refund = s.maxAmount - s.withdrawn - owed;

        s.cancelled = true;
        s.withdrawn += owed;
        s.maxAmount = s.withdrawn; // freeze accrual at the cancellation point

        if (owed > 0) IERC20(s.token).safeTransfer(s.recipient, owed);
        if (refund > 0) IERC20(s.token).safeTransfer(s.sender, refund);
        emit StreamCancelled(id, owed, refund);
    }

    // ---------- views ----------

    /// @notice Total accrued to recipient since start, capped at maxAmount (includes withdrawn).
    function accrued(uint256 id) public view returns (uint256) {
        Stream storage s = _get(id);
        if (s.cancelled) return s.withdrawn;
        if (block.timestamp <= s.startTime) return 0;
        uint256 elapsed = block.timestamp - s.startTime;
        uint256 amount = elapsed * s.ratePerSecond;
        return amount > s.maxAmount ? s.maxAmount : amount;
    }

    function withdrawable(uint256 id) public view returns (uint256) {
        Stream storage s = _get(id);
        return accrued(id) - s.withdrawn;
    }

    function getStream(uint256 id) external view returns (Stream memory) {
        return _get(id);
    }

    function _get(uint256 id) private view returns (Stream storage s) {
        s = _streams[id];
        if (s.sender == address(0)) revert NotFound();
    }
}
