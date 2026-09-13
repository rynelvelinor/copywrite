// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ContentProofClaims} from "../src/ContentProofClaims.sol";

contract ContentProofClaimsTest is Test {
    ContentProofClaims internal claims;
    address internal operator = address(0xA11CE);
    address internal alice = address(0xB0B);
    address internal bob = address(0xB0B2);

    function setUp() public {
        claims = new ContentProofClaims(operator);
        vm.prank(operator);
        claims.setVerifiedHuman(alice, true);
        vm.prank(operator);
        claims.setVerifiedHuman(bob, true);
    }

    function test_RegisterCreatorAndContent() public {
        vm.prank(alice);
        claims.registerCreator("alice");

        bytes32 hash = keccak256("image-phash");
        vm.prank(alice);
        claims.registerContent(hash, "https://origin.example/a.png", "CC-BY-4.0");

        ContentProofClaims.Claim memory c = claims.getClaim(hash);
        assertEq(c.owner, alice);
        assertEq(c.creatorLabel, "alice");
        assertFalse(c.revoked);
        assertEq(claims.ensNameOf(alice), "alice.copywrite.eth");
    }

    function test_RejectUnverifiedCreator() public {
        address eve = address(0xEEEE);
        vm.prank(eve);
        vm.expectRevert(ContentProofClaims.NotVerifiedHuman.selector);
        claims.registerCreator("eve");
    }

    function test_RejectDuplicateActiveClaim() public {
        vm.prank(alice);
        claims.registerCreator("alice");
        bytes32 hash = keccak256("same");

        vm.prank(alice);
        claims.registerContent(hash, "https://a", "MIT");

        vm.prank(bob);
        claims.registerCreator("bob");
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(ContentProofClaims.ClaimExists.selector, hash));
        claims.registerContent(hash, "https://b", "MIT");
    }

    function test_OnlyOwnerCanRevoke() public {
        vm.prank(alice);
        claims.registerCreator("alice");
        bytes32 hash = keccak256("rev");
        vm.prank(alice);
        claims.registerContent(hash, "https://a", "MIT");

        vm.prank(bob);
        vm.expectRevert(ContentProofClaims.NotClaimOwner.selector);
        claims.revokeContent(hash);

        vm.prank(alice);
        claims.revokeContent(hash);
        assertTrue(claims.getClaim(hash).revoked);
    }

    function test_LabelCannotBeStolen() public {
        vm.prank(alice);
        claims.registerCreator("alice");
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(ContentProofClaims.LabelTaken.selector, "alice"));
        claims.registerCreator("alice");
    }
}
