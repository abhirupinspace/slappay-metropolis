// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title SpendingPolicy
/// @notice Owner escrows ERC-20 into a policy; a designated agent address may spend from it
///         only within a per-transaction cap, a rolling daily cap, and a recipient allowlist.
///         The agent never holds the owner's funds or keys. Enforcement is entirely onchain.
contract SpendingPolicy is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Policy {
        address owner;
        address agent;
        address token;
        uint256 txLimit; // max per spend()
        uint256 dailyLimit; // max per UTC day
        uint256 balance; // escrowed funds remaining
        uint256 spentToday;
        uint64 dayIndex; // block.timestamp / 1 days for spentToday
        bool active;
        bool revoked;
        bool allowAnyRecipient;
        string name;
    }

    uint256 public nextId = 1;
    mapping(uint256 => Policy) private _policies;
    mapping(uint256 => mapping(address => bool)) public allowedRecipient;

    event PolicyCreated(
        uint256 indexed id,
        address indexed owner,
        address indexed agent,
        address token,
        uint256 txLimit,
        uint256 dailyLimit,
        bool allowAnyRecipient,
        string name
    );
    event PolicyFunded(uint256 indexed id, uint256 amount, uint256 newBalance);
    event PolicyWithdrawn(uint256 indexed id, uint256 amount, uint256 newBalance);
    event RecipientAllowed(uint256 indexed id, address indexed recipient, bool allowed);
    event PolicyPaused(uint256 indexed id);
    event PolicyResumed(uint256 indexed id);
    event PolicyRevoked(uint256 indexed id, uint256 refunded);
    event AgentSpent(
        uint256 indexed id, address indexed agent, address indexed recipient, uint256 amount, string memo
    );

    error InvalidAgent();
    error InvalidLimits();
    error InvalidAmount();
    error NotOwner();
    error NotAgent();
    error PolicyInactive();
    error PolicyIsRevoked();
    error ExceedsTxLimit(uint256 amount, uint256 limit);
    error ExceedsDailyLimit(uint256 wouldBe, uint256 limit);
    error RecipientNotAllowed(address recipient);
    error InsufficientBalance(uint256 requested, uint256 available);
    error NotFound();

    /// @notice Create a policy and optionally fund it. Caller must have approved `initialDeposit`.
    function create(
        address agent,
        address token,
        uint256 txLimit,
        uint256 dailyLimit,
        address[] calldata recipients,
        bool allowAnyRecipient,
        uint256 initialDeposit,
        string calldata name
    ) external nonReentrant returns (uint256 id) {
        if (agent == address(0) || agent == msg.sender) revert InvalidAgent();
        if (txLimit == 0 || dailyLimit == 0 || txLimit > dailyLimit) revert InvalidLimits();

        id = nextId++;
        Policy storage p = _policies[id];
        p.owner = msg.sender;
        p.agent = agent;
        p.token = token;
        p.txLimit = txLimit;
        p.dailyLimit = dailyLimit;
        p.active = true;
        p.allowAnyRecipient = allowAnyRecipient;
        p.name = name;

        emit PolicyCreated(id, msg.sender, agent, token, txLimit, dailyLimit, allowAnyRecipient, name);

        for (uint256 i = 0; i < recipients.length; i++) {
            allowedRecipient[id][recipients[i]] = true;
            emit RecipientAllowed(id, recipients[i], true);
        }

        if (initialDeposit > 0) _fund(id, p, initialDeposit);
    }

    function fund(uint256 id, uint256 amount) external nonReentrant {
        Policy storage p = _get(id);
        if (msg.sender != p.owner) revert NotOwner();
        if (p.revoked) revert PolicyIsRevoked();
        if (amount == 0) revert InvalidAmount();
        _fund(id, p, amount);
    }

    /// @notice Owner pulls escrowed funds back out (does not revoke).
    function withdraw(uint256 id, uint256 amount) external nonReentrant {
        Policy storage p = _get(id);
        if (msg.sender != p.owner) revert NotOwner();
        if (amount == 0 || amount > p.balance) revert InsufficientBalance(amount, p.balance);
        p.balance -= amount;
        IERC20(p.token).safeTransfer(p.owner, amount);
        emit PolicyWithdrawn(id, amount, p.balance);
    }

    function setRecipient(uint256 id, address recipient, bool allowed) external {
        Policy storage p = _get(id);
        if (msg.sender != p.owner) revert NotOwner();
        if (p.revoked) revert PolicyIsRevoked();
        allowedRecipient[id][recipient] = allowed;
        emit RecipientAllowed(id, recipient, allowed);
    }

    function pause(uint256 id) external {
        Policy storage p = _get(id);
        if (msg.sender != p.owner) revert NotOwner();
        if (p.revoked) revert PolicyIsRevoked();
        p.active = false;
        emit PolicyPaused(id);
    }

    function resume(uint256 id) external {
        Policy storage p = _get(id);
        if (msg.sender != p.owner) revert NotOwner();
        if (p.revoked) revert PolicyIsRevoked();
        p.active = true;
        emit PolicyResumed(id);
    }

    /// @notice Permanently disable the policy and refund all escrowed funds to the owner.
    function revoke(uint256 id) external nonReentrant {
        Policy storage p = _get(id);
        if (msg.sender != p.owner) revert NotOwner();
        if (p.revoked) revert PolicyIsRevoked();
        p.revoked = true;
        p.active = false;
        uint256 refund = p.balance;
        p.balance = 0;
        if (refund > 0) IERC20(p.token).safeTransfer(p.owner, refund);
        emit PolicyRevoked(id, refund);
    }

    /// @notice Agent-initiated payment. Reverts unless every policy rule passes.
    function spend(uint256 id, address recipient, uint256 amount, string calldata memo)
        external
        nonReentrant
    {
        Policy storage p = _get(id);
        if (msg.sender != p.agent) revert NotAgent();
        if (p.revoked) revert PolicyIsRevoked();
        if (!p.active) revert PolicyInactive();
        if (amount == 0) revert InvalidAmount();
        if (amount > p.txLimit) revert ExceedsTxLimit(amount, p.txLimit);
        if (!p.allowAnyRecipient && !allowedRecipient[id][recipient]) revert RecipientNotAllowed(recipient);

        uint64 today = _today();
        uint256 spent = p.dayIndex == today ? p.spentToday : 0;
        if (spent + amount > p.dailyLimit) revert ExceedsDailyLimit(spent + amount, p.dailyLimit);
        if (amount > p.balance) revert InsufficientBalance(amount, p.balance);

        p.dayIndex = today;
        p.spentToday = spent + amount;
        p.balance -= amount;

        IERC20(p.token).safeTransfer(recipient, amount);
        emit AgentSpent(id, msg.sender, recipient, amount, memo);
    }

    // ---------- views ----------

    function getPolicy(uint256 id) external view returns (Policy memory p) {
        p = _get(id);
        if (p.dayIndex != _today()) p.spentToday = 0; // present current-day view
    }

    /// @notice Remaining spendable today = min(dailyLimit - spentToday, balance).
    function remainingToday(uint256 id) external view returns (uint256) {
        Policy storage p = _get(id);
        uint256 spent = p.dayIndex == _today() ? p.spentToday : 0;
        uint256 dailyLeft = p.dailyLimit - spent;
        return dailyLeft < p.balance ? dailyLeft : p.balance;
    }

    /// @notice Dry-run of spend() rules. Returns (ok, reason).
    function canSpend(uint256 id, address agent, address recipient, uint256 amount)
        external
        view
        returns (bool, string memory)
    {
        Policy storage p = _get(id);
        if (agent != p.agent) return (false, "not agent");
        if (p.revoked) return (false, "revoked");
        if (!p.active) return (false, "paused");
        if (amount == 0) return (false, "zero amount");
        if (amount > p.txLimit) return (false, "exceeds tx limit");
        if (!p.allowAnyRecipient && !allowedRecipient[id][recipient]) return (false, "recipient not allowed");
        uint256 spent = p.dayIndex == _today() ? p.spentToday : 0;
        if (spent + amount > p.dailyLimit) return (false, "exceeds daily limit");
        if (amount > p.balance) return (false, "insufficient policy balance");
        return (true, "");
    }

    // ---------- internal ----------

    function _fund(uint256 id, Policy storage p, uint256 amount) private {
        p.balance += amount;
        IERC20(p.token).safeTransferFrom(msg.sender, address(this), amount);
        emit PolicyFunded(id, amount, p.balance);
    }

    function _today() private view returns (uint64) {
        return uint64(block.timestamp / 1 days);
    }

    function _get(uint256 id) private view returns (Policy storage p) {
        p = _policies[id];
        if (p.owner == address(0)) revert NotFound();
    }
}
