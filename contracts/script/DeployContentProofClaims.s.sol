// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {ContentProofClaims} from "../src/ContentProofClaims.sol";

contract DeployContentProofClaims is Script {
    function run() external returns (ContentProofClaims claims) {
        address operator = vm.envOr("CONTENTPROOF_OPERATOR", msg.sender);
        vm.startBroadcast();
        claims = new ContentProofClaims(operator);
        vm.stopBroadcast();
    }
}
