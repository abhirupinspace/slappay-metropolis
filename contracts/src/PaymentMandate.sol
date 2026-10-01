// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title PaymentMandate
/// @notice Conditional escrow: sender locks ERC-20 for a recipient; funds release when the
///         configured condition is satisfied. One contract holds many mandates keyed by id.
contract PaymentMandate is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum ConditionType {
        MANUAL_APPROVAL, // sender approves
        ATTESTATION, // designated verifier approves
        TIME // releasable once block.timestamp >= releaseAfter
    }

    enum Status {
        ACTIVE,
        RELEASED,
        CANCELLED
    }

    struct Mandate {
        address sender;
        address recipient;
        address token;
        uint256 amount;
        ConditionType conditionType;
        address verifier; // only used for ATTESTATION
        uint64 releaseAfter; // only used for TIME
        uint64 expiry; // sender may cancel after this
        bool approved;
        Status status;
        string memo;
    }

    uint256 public nextId = 1;
    mapping(uint256 => Mandate) private _mandates;

    event MandateCreated(
        uint256 indexed id,
        address indexed sender,
        address indexed recipient,
        address token,
        uint256 amount,
        ConditionType conditionType,
        address verifier,
        uint64 releaseAfter,
        uint64 expiry,
        string memo
    );
    event MandateApproved(uint256 indexed id, address indexed approver);
    event MandateReleased(uint256 indexed id, address indexed recipient, uint256 amount);
    event MandateCancelled(uint256 indexed id, address indexed by, uint256 refunded);

    error InvalidRecipient();
    error InvalidAmount();
    error InvalidExpiry();
    error InvalidVerifier();
    error InvalidReleaseTime();
    error NotActive();
    error NotAuthorized();
    error ConditionNotMet();
    error NotExpired();
    error NotFound();

    /// @notice Create and fund a mandate in one call. Caller must have approved `amount` of `token`.
    function create(
        address recipient,
        address token,
        uint256 amount,
        ConditionType conditionType,
        address verifier,
        uint64 releaseAfter,
        uint64 expiry,
        string calldata memo
    ) external nonReentrant returns (uint256 id) {
        if (recipient == address(0) || recipient == msg.sender) revert InvalidRecipient();
        if (amount == 0) revert InvalidAmount();
        if (expiry <= block.timestamp) revert InvalidExpiry();
        if (conditionType == ConditionType.ATTESTATION && verifier == address(0)) revert InvalidVerifier();
        if (conditionType == ConditionType.TIME && (releaseAfter <= block.timestamp || releaseAfter > expiry)) {
            revert InvalidReleaseTime();
        }

        id = nextId++;
        _mandates[id] = Mandate({
            sender: msg.sender,
            recipient: recipient,
            token: token,
            amount: amount,
            conditionType: conditionType,
            verifier: conditionType == ConditionType.ATTESTATION ? verifier : address(0),
            releaseAfter: conditionType == ConditionType.TIME ? releaseAfter : 0,
            expiry: expiry,
            approved: false,
            status: Status.ACTIVE,
            memo: memo
        });

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        emit MandateCreated(
            id, msg.sender, recipient, token, amount, conditionType, verifier, releaseAfter, expiry, memo
        );
    }

    /// @notice Mark the condition satisfied. Sender for MANUAL_APPROVAL, verifier for ATTESTATION.
    ///         Approving also releases funds immediately.
    function approve(uint256 id) external nonReentrant {
        Mandate storage m = _get(id);
        if (m.status != Status.ACTIVE) revert NotActive();
        if (m.conditionType == ConditionType.MANUAL_APPROVAL) {
            if (msg.sender != m.sender) revert NotAuthorized();
        } else if (m.conditionType == ConditionType.ATTESTATION) {
            if (msg.sender != m.verifier) revert NotAuthorized();
        } else {
            revert NotAuthorized(); // TIME mandates release via release()
        }
        m.approved = true;
        emit MandateApproved(id, msg.sender);
        _release(id, m);
    }

    /// @notice Release funds to recipient if the condition is met. Anyone may call.
    function release(uint256 id) external nonReentrant {
        Mandate storage m = _get(id);
        if (m.status != Status.ACTIVE) revert NotActive();
        if (!isReleasable(id)) revert ConditionNotMet();
        _release(id, m);
    }

    /// @notice Sender may cancel after expiry; recipient may decline any time. Funds return to sender.
    function cancel(uint256 id) external nonReentrant {
        Mandate storage m = _get(id);
        if (m.status != Status.ACTIVE) revert NotActive();
        if (msg.sender == m.sender) {
            if (block.timestamp < m.expiry) revert NotExpired();
        } else if (msg.sender != m.recipient) {
            revert NotAuthorized();
        }
        m.status = Status.CANCELLED;
        IERC20(m.token).safeTransfer(m.sender, m.amount);
        emit MandateCancelled(id, msg.sender, m.amount);
    }

    function isReleasable(uint256 id) public view returns (bool) {
        Mandate storage m = _get(id);
        if (m.status != Status.ACTIVE) return false;
        if (m.conditionType == ConditionType.TIME) return block.timestamp >= m.releaseAfter;
        return m.approved;
    }

    function getMandate(uint256 id) external view returns (Mandate memory) {
        return _get(id);
    }

    function _release(uint256 id, Mandate storage m) private {
        m.status = Status.RELEASED;
        IERC20(m.token).safeTransfer(m.recipient, m.amount);
        emit MandateReleased(id, m.recipient, m.amount);
    }

    function _get(uint256 id) private view returns (Mandate storage m) {
        m = _mandates[id];
        if (m.sender == address(0)) revert NotFound();
    }
}
