// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {BaseTest} from "./Base.t.sol";
import {PaymentMandate} from "../src/PaymentMandate.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

contract PaymentMandateTest is BaseTest {
    PaymentMandate m;
    uint64 expiry;

    function setUp() public override {
        super.setUp();
        m = new PaymentMandate();
        expiry = uint64(block.timestamp + 7 days);
        _approve(alice, address(m), type(uint256).max);
    }

    function _createManual(uint256 amt) internal returns (uint256) {
        vm.prank(alice);
        return m.create(bob, address(usdc), amt, PaymentMandate.ConditionType.MANUAL_APPROVAL, address(0), 0, expiry, "site");
    }

    function test_create_escrowsFunds() public {
        uint256 id = _createManual(500 * ONE);
        assertEq(id, 1);
        assertEq(usdc.balanceOf(address(m)), 500 * ONE);
        PaymentMandate.Mandate memory md = m.getMandate(id);
        assertEq(md.sender, alice);
        assertEq(md.recipient, bob);
        assertEq(uint8(md.status), uint8(PaymentMandate.Status.ACTIVE));
        assertFalse(m.isReleasable(id));
    }

    function test_create_revertsInsufficientFunding() public {
        address poor = makeAddr("poor");
        _approve(poor, address(m), type(uint256).max);
        vm.prank(poor);
        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientBalance.selector, poor, 0, ONE));
        m.create(bob, address(usdc), ONE, PaymentMandate.ConditionType.MANUAL_APPROVAL, address(0), 0, expiry, "");
    }

    function test_create_revertsBadInputs() public {
        vm.startPrank(alice);
        vm.expectRevert(PaymentMandate.InvalidRecipient.selector);
        m.create(alice, address(usdc), ONE, PaymentMandate.ConditionType.MANUAL_APPROVAL, address(0), 0, expiry, "");
        vm.expectRevert(PaymentMandate.InvalidAmount.selector);
        m.create(bob, address(usdc), 0, PaymentMandate.ConditionType.MANUAL_APPROVAL, address(0), 0, expiry, "");
        vm.expectRevert(PaymentMandate.InvalidExpiry.selector);
        m.create(bob, address(usdc), ONE, PaymentMandate.ConditionType.MANUAL_APPROVAL, address(0), 0, uint64(block.timestamp), "");
        vm.expectRevert(PaymentMandate.InvalidVerifier.selector);
        m.create(bob, address(usdc), ONE, PaymentMandate.ConditionType.ATTESTATION, address(0), 0, expiry, "");
        vm.expectRevert(PaymentMandate.InvalidReleaseTime.selector);
        m.create(bob, address(usdc), ONE, PaymentMandate.ConditionType.TIME, address(0), expiry + 1, expiry, "");
        vm.stopPrank();
    }

    function test_manualApprove_releasesToRecipient() public {
        uint256 id = _createManual(500 * ONE);
        vm.prank(alice);
        m.approve(id);
        assertEq(usdc.balanceOf(bob), 500 * ONE);
        assertEq(usdc.balanceOf(address(m)), 0);
        assertEq(uint8(m.getMandate(id).status), uint8(PaymentMandate.Status.RELEASED));
    }

    function test_manualApprove_unauthorized() public {
        uint256 id = _createManual(ONE);
        vm.prank(bob);
        vm.expectRevert(PaymentMandate.NotAuthorized.selector);
        m.approve(id);
        vm.prank(carol);
        vm.expectRevert(PaymentMandate.NotAuthorized.selector);
        m.approve(id);
    }

    function test_release_withoutApproval_reverts() public {
        uint256 id = _createManual(ONE);
        vm.expectRevert(PaymentMandate.ConditionNotMet.selector);
        m.release(id);
    }

    function test_doubleRelease_reverts() public {
        uint256 id = _createManual(ONE);
        vm.prank(alice);
        m.approve(id);
        vm.prank(alice);
        vm.expectRevert(PaymentMandate.NotActive.selector);
        m.approve(id);
        vm.expectRevert(PaymentMandate.NotActive.selector);
        m.release(id);
    }

    function test_attestation_onlyVerifier() public {
        vm.prank(alice);
        uint256 id = m.create(bob, address(usdc), ONE, PaymentMandate.ConditionType.ATTESTATION, carol, 0, expiry, "");
        vm.prank(alice);
        vm.expectRevert(PaymentMandate.NotAuthorized.selector);
        m.approve(id);
        vm.prank(carol);
        m.approve(id);
        assertEq(usdc.balanceOf(bob), ONE);
    }

    function test_time_releasesAfterTimestamp_anyoneCanCall() public {
        uint64 at = uint64(block.timestamp + 1 days);
        vm.prank(alice);
        uint256 id = m.create(bob, address(usdc), ONE, PaymentMandate.ConditionType.TIME, address(0), at, expiry, "");
        vm.expectRevert(PaymentMandate.ConditionNotMet.selector);
        m.release(id);
        vm.prank(alice);
        vm.expectRevert(PaymentMandate.NotAuthorized.selector);
        m.approve(id);
        vm.warp(at);
        vm.prank(carol);
        m.release(id);
        assertEq(usdc.balanceOf(bob), ONE);
    }

    function test_cancel_senderBeforeExpiry_reverts() public {
        uint256 id = _createManual(ONE);
        vm.prank(alice);
        vm.expectRevert(PaymentMandate.NotExpired.selector);
        m.cancel(id);
    }

    function test_cancel_senderAfterExpiry_refunds() public {
        uint256 id = _createManual(ONE);
        uint256 before = usdc.balanceOf(alice);
        vm.warp(expiry);
        vm.prank(alice);
        m.cancel(id);
        assertEq(usdc.balanceOf(alice), before + ONE);
        assertEq(uint8(m.getMandate(id).status), uint8(PaymentMandate.Status.CANCELLED));
        vm.prank(alice);
        vm.expectRevert(PaymentMandate.NotActive.selector);
        m.approve(id);
    }

    function test_cancel_recipientDeclinesAnytime() public {
        uint256 id = _createManual(ONE);
        uint256 before = usdc.balanceOf(alice);
        vm.prank(bob);
        m.cancel(id);
        assertEq(usdc.balanceOf(alice), before + ONE);
    }

    function test_cancel_stranger_reverts() public {
        uint256 id = _createManual(ONE);
        vm.prank(carol);
        vm.expectRevert(PaymentMandate.NotAuthorized.selector);
        m.cancel(id);
    }

    function test_unknownId_reverts() public {
        vm.expectRevert(PaymentMandate.NotFound.selector);
        m.getMandate(99);
    }
}
