// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {PaymentMandate} from "../src/PaymentMandate.sol";
import {SpendingPolicy} from "../src/SpendingPolicy.sol";
import {PaymentStream} from "../src/PaymentStream.sol";

/// @dev forge script script/Deploy.s.sol --rpc-url monad_testnet --broadcast
///      Writes deployments/<chainId>.json for the web app to consume.
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address usdc = vm.envAddress("USDC_ADDRESS");

        vm.startBroadcast(pk);
        PaymentMandate mandate = new PaymentMandate();
        SpendingPolicy policy = new SpendingPolicy();
        PaymentStream stream = new PaymentStream();
        vm.stopBroadcast();

        string memory json = "deployment";
        vm.serializeUint(json, "chainId", block.chainid);
        vm.serializeAddress(json, "usdc", usdc);
        vm.serializeAddress(json, "paymentMandate", address(mandate));
        vm.serializeAddress(json, "spendingPolicy", address(policy));
        vm.serializeAddress(json, "paymentStream", address(stream));
        vm.serializeUint(json, "deployedAt", block.timestamp);
        string memory out = vm.serializeUint(json, "deployBlock", block.number);
        string memory path = string.concat("deployments/", vm.toString(block.chainid), ".json");
        vm.writeJson(out, path);

        console.log("PaymentMandate:", address(mandate));
        console.log("SpendingPolicy:", address(policy));
        console.log("PaymentStream :", address(stream));
        console.log("written:", path);
    }
}
