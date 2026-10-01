// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {BaseTest} from "./Base.t.sol";
import {SpendingPolicy} from "../src/SpendingPolicy.sol";

contract SpendingPolicyTest is BaseTest {
    SpendingPolicy sp;
    address apiA = makeAddr("apiA");
    address apiB = makeAddr("apiB");
    uint256 id;

    function setUp() public override {
        super.setUp();
        sp = new SpendingPolicy();
        _approve(alice, address(sp), type(uint256).max);
        address[] memory allowed = new address[](2);
        allowed[0] = apiA;
        allowed[1] = apiB;
        vm.prank(alice);
        id = sp.create(agent, address(usdc), 2 * ONE, 20 * ONE, allowed, false, 100 * ONE, "ResearchBot");
    }

    function _spend(uint256 amt) internal {
        vm.prank(agent);
        sp.spend(id, apiA, amt, "api call");
    }

    function test_create_state() public view {
        SpendingPolicy.Policy memory p = sp.getPolicy(id);
        assertEq(p.owner, alice);
        assertEq(p.agent, agent);
        assertEq(p.balance, 100 * ONE);
        assertTrue(p.active);
        assertTrue(sp.allowedRecipient(id, apiA));
        assertFalse(sp.allowedRecipient(id, carol));
        assertEq(sp.remainingToday(id), 20 * ONE);
    }

    function test_create_invalidLimits() public {
        address[] memory none;
        vm.startPrank(alice);
        vm.expectRevert(SpendingPolicy.InvalidLimits.selector);
        sp.create(agent, address(usdc), 3 * ONE, 2 * ONE, none, true, 0, "");
        vm.expectRevert(SpendingPolicy.InvalidLimits.selector);
        sp.create(agent, address(usdc), 0, 2 * ONE, none, true, 0, "");
        vm.expectRevert(SpendingPolicy.InvalidAgent.selector);
        sp.create(alice, address(usdc), ONE, 2 * ONE, none, true, 0, "");
        vm.stopPrank();
    }

    function test_spend_valid() public {
        _spend(ONE);
        assertEq(usdc.balanceOf(apiA), ONE);
        assertEq(sp.getPolicy(id).balance, 99 * ONE);
        assertEq(sp.getPolicy(id).spentToday, ONE);
        assertEq(sp.remainingToday(id), 19 * ONE);
    }

    function test_spend_exceedsTxLimit() public {
        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(SpendingPolicy.ExceedsTxLimit.selector, 3 * ONE, 2 * ONE));
        sp.spend(id, apiA, 3 * ONE, "");
    }

    function test_spend_txLimitBoundary() public {
        _spend(2 * ONE); // exactly at limit ok
        assertEq(usdc.balanceOf(apiA), 2 * ONE);
    }

    function test_spend_cumulativeDailyLimit() public {
        for (uint256 i = 0; i < 10; i++) _spend(2 * ONE); // 20 total
        assertEq(sp.remainingToday(id), 0);
        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(SpendingPolicy.ExceedsDailyLimit.selector, 21 * ONE, 20 * ONE));
        sp.spend(id, apiA, ONE, "");
    }

    function test_spend_dailyLimitResetsNextDay() public {
        for (uint256 i = 0; i < 10; i++) _spend(2 * ONE);
        vm.warp(((block.timestamp / 1 days) + 1) * 1 days);
        assertEq(sp.remainingToday(id), 20 * ONE);
        _spend(ONE);
        assertEq(sp.getPolicy(id).spentToday, ONE);
    }

    function test_spend_recipientNotAllowed() public {
        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(SpendingPolicy.RecipientNotAllowed.selector, carol));
        sp.spend(id, carol, ONE, "");
    }

    function test_spend_allowAnyRecipient() public {
        address[] memory none;
        vm.prank(alice);
        uint256 id2 = sp.create(agent, address(usdc), ONE, 5 * ONE, none, true, 5 * ONE, "open");
        vm.prank(agent);
        sp.spend(id2, carol, ONE, "");
        assertEq(usdc.balanceOf(carol), ONE);
    }

    function test_spend_notAgent() public {
        vm.prank(carol);
        vm.expectRevert(SpendingPolicy.NotAgent.selector);
        sp.spend(id, apiA, ONE, "");
        vm.prank(alice); // owner is not the agent either
        vm.expectRevert(SpendingPolicy.NotAgent.selector);
        sp.spend(id, apiA, ONE, "");
    }

    function test_spend_paused() public {
        vm.prank(alice);
        sp.pause(id);
        vm.prank(agent);
        vm.expectRevert(SpendingPolicy.PolicyInactive.selector);
        sp.spend(id, apiA, ONE, "");
        vm.prank(alice);
        sp.resume(id);
        _spend(ONE);
    }

    function test_spend_insufficientBalance() public {
        vm.prank(alice);
        sp.withdraw(id, 99 * ONE + ONE / 2);
        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(SpendingPolicy.InsufficientBalance.selector, ONE, ONE / 2));
        sp.spend(id, apiA, ONE, "");
        assertEq(sp.remainingToday(id), ONE / 2);
    }

    function test_revoke_refundsAndBlocksEverything() public {
        _spend(ONE);
        uint256 before = usdc.balanceOf(alice);
        vm.prank(alice);
        sp.revoke(id);
        assertEq(usdc.balanceOf(alice), before + 99 * ONE);
        vm.prank(agent);
        vm.expectRevert(SpendingPolicy.PolicyIsRevoked.selector);
        sp.spend(id, apiA, ONE, "");
        vm.startPrank(alice);
        vm.expectRevert(SpendingPolicy.PolicyIsRevoked.selector);
        sp.resume(id);
        vm.expectRevert(SpendingPolicy.PolicyIsRevoked.selector);
        sp.fund(id, ONE);
        vm.stopPrank();
    }

    function test_ownerOnly_admin() public {
        vm.startPrank(carol);
        vm.expectRevert(SpendingPolicy.NotOwner.selector);
        sp.pause(id);
        vm.expectRevert(SpendingPolicy.NotOwner.selector);
        sp.revoke(id);
        vm.expectRevert(SpendingPolicy.NotOwner.selector);
        sp.withdraw(id, ONE);
        vm.expectRevert(SpendingPolicy.NotOwner.selector);
        sp.setRecipient(id, carol, true);
        vm.stopPrank();
    }

    function test_setRecipient_toggles() public {
        vm.prank(alice);
        sp.setRecipient(id, apiA, false);
        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(SpendingPolicy.RecipientNotAllowed.selector, apiA));
        sp.spend(id, apiA, ONE, "");
    }

    function test_canSpend_mirrorsRules() public {
        (bool ok, string memory why) = sp.canSpend(id, agent, apiA, ONE);
        assertTrue(ok);
        assertEq(why, "");
        (ok, why) = sp.canSpend(id, agent, apiA, 3 * ONE);
        assertFalse(ok);
        assertEq(why, "exceeds tx limit");
        (ok, why) = sp.canSpend(id, agent, carol, ONE);
        assertEq(why, "recipient not allowed");
    }

    function test_fund_increasesBalance() public {
        vm.prank(alice);
        sp.fund(id, 50 * ONE);
        assertEq(sp.getPolicy(id).balance, 150 * ONE);
    }
}
