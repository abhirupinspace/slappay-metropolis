// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {PaymentMandate} from "../src/PaymentMandate.sol";
import {SpendingPolicy} from "../src/SpendingPolicy.sol";
import {PaymentStream} from "../src/PaymentStream.sol";

/// @dev Local anvil only: deploys MockUSDC + contracts, mints to deployer, funds a demo policy.
///      forge script script/DeployLocal.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
contract DeployLocal is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address agent = vm.envAddress("AGENT_ADDRESS");
        address payTo = vm.envAddress("X402_PAY_TO");
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);
        MockUSDC usdc = new MockUSDC();
        usdc.mint(deployer, 1_000_000e6);
        PaymentMandate mandate = new PaymentMandate();
        SpendingPolicy policy = new SpendingPolicy();
        PaymentStream stream = new PaymentStream();

        usdc.approve(address(policy), 100e6);
        address[] memory allowed = new address[](1);
        allowed[0] = payTo;
        uint256 policyId = policy.create(agent, address(usdc), 2e6, 20e6, allowed, false, 100e6, "ResearchBot");
        vm.stopBroadcast();

        string memory json = "deployment";
        vm.serializeUint(json, "chainId", block.chainid);
        vm.serializeAddress(json, "usdc", address(usdc));
        vm.serializeAddress(json, "paymentMandate", address(mandate));
        vm.serializeAddress(json, "spendingPolicy", address(policy));
        vm.serializeAddress(json, "paymentStream", address(stream));
        vm.serializeUint(json, "deployedAt", block.timestamp);
        string memory out = vm.serializeUint(json, "deployBlock", block.number);
        vm.writeJson(out, string.concat("deployments/", vm.toString(block.chainid), ".json"));
        console.log("usdc:", address(usdc));
        console.log("policyId:", policyId);
    }
}
