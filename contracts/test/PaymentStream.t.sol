// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {BaseTest} from "./Base.t.sol";
import {PaymentStream} from "../src/PaymentStream.sol";

contract PaymentStreamTest is BaseTest {
    PaymentStream ps;
    uint256 rate = 20 * ONE / 3600; // $20/hour in base units per second = 5555
    uint256 max = 200 * ONE;

    function setUp() public override {
        super.setUp();
        ps = new PaymentStream();
        _approve(alice, address(ps), type(uint256).max);
    }

    function _create() internal returns (uint256) {
        vm.prank(alice);
        return ps.create(bob, address(usdc), rate, 0, max, "dev work");
    }

    function test_create_fundsAndComputesEnd() public {
        uint256 id = _create();
        PaymentStream.Stream memory s = ps.getStream(id);
        assertEq(usdc.balanceOf(address(ps)), max);
        assertEq(s.startTime, block.timestamp);
        assertEq(s.endTime, block.timestamp + (max + rate - 1) / rate);
        assertEq(ps.accrued(id), 0);
    }

    function test_create_invalid() public {
        vm.startPrank(alice);
        vm.expectRevert(PaymentStream.InvalidRecipient.selector);
        ps.create(alice, address(usdc), rate, 0, max, "");
        vm.expectRevert(PaymentStream.InvalidRate.selector);
        ps.create(bob, address(usdc), 0, 0, max, "");
        vm.expectRevert(PaymentStream.InvalidAmount.selector);
        ps.create(bob, address(usdc), rate, 0, 0, "");
        vm.expectRevert(PaymentStream.InvalidStartTime.selector);
        ps.create(bob, address(usdc), rate, uint64(block.timestamp - 1), max, "");
        vm.stopPrank();
    }

    function test_accrual_linear() public {
        uint256 id = _create();
        vm.warp(block.timestamp + 3600);
        assertEq(ps.accrued(id), rate * 3600);
        assertEq(ps.withdrawable(id), rate * 3600);
    }

    function test_accrual_cappedAtMax() public {
        uint256 id = _create();
        vm.warp(block.timestamp + 365 days);
        assertEq(ps.accrued(id), max);
    }

    function test_withdraw_onlyRecipient() public {
        uint256 id = _create();
        vm.warp(block.timestamp + 10);
        vm.prank(alice);
        vm.expectRevert(PaymentStream.NotRecipient.selector);
        ps.withdraw(id);
    }

    function test_withdraw_multiple_noDouble() public {
        uint256 id = _create();
        vm.warp(block.timestamp + 3600);
        vm.prank(bob);
        uint256 a = ps.withdraw(id);
        assertEq(a, rate * 3600);
        assertEq(usdc.balanceOf(bob), a);
        vm.prank(bob);
        vm.expectRevert(PaymentStream.NothingToWithdraw.selector);
        ps.withdraw(id);
        vm.warp(block.timestamp + 1800);
        vm.prank(bob);
        uint256 b = ps.withdraw(id);
        assertEq(b, rate * 1800);
        assertEq(usdc.balanceOf(bob), a + b);
    }

    function test_withdraw_totalNeverExceedsMax() public {
        uint256 id = _create();
        vm.warp(block.timestamp + 365 days);
        vm.prank(bob);
        ps.withdraw(id);
        assertEq(usdc.balanceOf(bob), max);
        assertEq(usdc.balanceOf(address(ps)), 0);
        vm.warp(block.timestamp + 1 days);
        vm.prank(bob);
        vm.expectRevert(PaymentStream.NothingToWithdraw.selector);
        ps.withdraw(id);
    }

    function test_cancel_splitsCorrectly() public {
        uint256 id = _create();
        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.warp(block.timestamp + 3600);
        vm.prank(alice);
        ps.cancel(id);
        uint256 owed = rate * 3600;
        assertEq(usdc.balanceOf(bob), owed);
        assertEq(usdc.balanceOf(alice), aliceBefore + max - owed);
        assertEq(usdc.balanceOf(address(ps)), 0);
        vm.warp(block.timestamp + 3600);
        assertEq(ps.withdrawable(id), 0);
        vm.prank(alice);
        vm.expectRevert(PaymentStream.AlreadyCancelled.selector);
        ps.cancel(id);
    }

    function test_cancel_afterPartialWithdraw() public {
        uint256 id = _create();
        vm.warp(block.timestamp + 3600);
        vm.prank(bob);
        ps.withdraw(id);
        vm.warp(block.timestamp + 3600);
        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        ps.cancel(id);
        assertEq(usdc.balanceOf(bob), rate * 7200);
        assertEq(usdc.balanceOf(alice), aliceBefore + max - rate * 7200);
    }

    function test_cancel_onlySender() public {
        uint256 id = _create();
        vm.prank(bob);
        vm.expectRevert(PaymentStream.NotSender.selector);
        ps.cancel(id);
    }

    function test_futureStart_noAccrualBefore() public {
        uint64 start = uint64(block.timestamp + 1 days);
        vm.prank(alice);
        uint256 id = ps.create(bob, address(usdc), rate, start, max, "");
        vm.warp(start - 1);
        assertEq(ps.accrued(id), 0);
        vm.warp(start + 100);
        assertEq(ps.accrued(id), rate * 100);
    }

    function testFuzz_accrualNeverExceedsMax(uint32 elapsed) public {
        uint256 id = _create();
        vm.warp(block.timestamp + elapsed);
        assertLe(ps.accrued(id), max);
    }
}
