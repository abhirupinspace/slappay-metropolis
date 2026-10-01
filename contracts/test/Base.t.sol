// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";

abstract contract BaseTest is Test {
    MockUSDC usdc;
    address alice = makeAddr("alice"); // sender / owner
    address bob = makeAddr("bob"); // recipient
    address carol = makeAddr("carol"); // verifier / stranger
    address agent = makeAddr("agent");

    uint256 constant ONE = 1e6;

    function setUp() public virtual {
        usdc = new MockUSDC();
        usdc.mint(alice, 1_000_000 * ONE);
        vm.warp(1_700_000_000);
    }

    function _approve(address who, address spender, uint256 amt) internal {
        vm.prank(who);
        usdc.approve(spender, amt);
    }
}
