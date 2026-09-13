// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ContentProofClaims
 * @notice Creator content-claim registry for the Copywrite demo.
 * @dev Domain logic for non-transferable, owner-revocable content claims.
 *      ENSv2 Permissioned Registry/Resolver wiring (subnames + text records)
 *      is layered via ContentProofEnsAdapter once ensdomains/contracts-v2 is linked.
 *
 * Why ENSv2 hierarchy still matters here:
 * - Creator identity = subname under copywrite.eth
 * - Each claim = content subname / label under the creator
 * - Enhanced Access Control = no transfer of claims; revoke only by registrant
 */
contract ContentProofClaims {
    struct Claim {
        address owner;
        bytes32 contentHash;
        string creatorLabel;
        string originUrl;
        string license;
        uint64 registeredAt;
        bool revoked;
        bool exists;
    }

    error NotVerifiedHuman();
    error LabelTaken(string label);
    error LabelUnavailable(string label);
    error ClaimExists(bytes32 contentHash);
    error ClaimNotFound(bytes32 contentHash);
    error NotClaimOwner();
    error AlreadyRevoked();
    error EmptyLabel();
    error ZeroAddress();

    event CreatorRegistered(address indexed owner, string label);
    event ContentRegistered(
        address indexed owner,
        string creatorLabel,
        bytes32 indexed contentHash,
        string originUrl,
        string license,
        uint64 registeredAt
    );
    event ContentRevoked(address indexed owner, bytes32 indexed contentHash);

    /// @dev operator can mark wallets as World-ID-verified for registration gate (demo/relayer)
    address public immutable operator;

    mapping(address => bool) public isVerifiedHuman;
    mapping(address => string) public creatorLabelOf;
    mapping(string => address) public ownerOfLabel;
    mapping(bytes32 => Claim) public claims;
    mapping(address => bytes32[]) private _claimsByOwner;

    constructor(address operator_) {
        if (operator_ == address(0)) revert ZeroAddress();
        operator = operator_;
    }

    modifier onlyOperator() {
        require(msg.sender == operator, "not operator");
        _;
    }

    function setVerifiedHuman(address account, bool verified) external onlyOperator {
        isVerifiedHuman[account] = verified;
    }

    function registerCreator(string calldata label) external {
        if (!isVerifiedHuman[msg.sender]) revert NotVerifiedHuman();
        if (bytes(label).length == 0) revert EmptyLabel();
        if (bytes(creatorLabelOf[msg.sender]).length != 0) {
            revert LabelTaken(creatorLabelOf[msg.sender]);
        }
        if (ownerOfLabel[label] != address(0)) revert LabelTaken(label);

        creatorLabelOf[msg.sender] = label;
        ownerOfLabel[label] = msg.sender;
        emit CreatorRegistered(msg.sender, label);
    }

    function registerContent(
        bytes32 contentHash,
        string calldata originUrl,
        string calldata license
    ) external {
        if (!isVerifiedHuman[msg.sender]) revert NotVerifiedHuman();
        string memory label = creatorLabelOf[msg.sender];
        if (bytes(label).length == 0) revert LabelUnavailable(label);
        if (claims[contentHash].exists && !claims[contentHash].revoked) {
            revert ClaimExists(contentHash);
        }

        uint64 ts = uint64(block.timestamp);
        claims[contentHash] = Claim({
            owner: msg.sender,
            contentHash: contentHash,
            creatorLabel: label,
            originUrl: originUrl,
            license: license,
            registeredAt: ts,
            revoked: false,
            exists: true
        });
        _claimsByOwner[msg.sender].push(contentHash);

        emit ContentRegistered(msg.sender, label, contentHash, originUrl, license, ts);
    }

    function revokeContent(bytes32 contentHash) external {
        Claim storage claim = claims[contentHash];
        if (!claim.exists) revert ClaimNotFound(contentHash);
        if (claim.owner != msg.sender) revert NotClaimOwner();
        if (claim.revoked) revert AlreadyRevoked();

        claim.revoked = true;
        emit ContentRevoked(msg.sender, contentHash);
    }

    function getClaim(bytes32 contentHash) external view returns (Claim memory) {
        return claims[contentHash];
    }

    function getClaimsByOwner(address owner) external view returns (bytes32[] memory) {
        return _claimsByOwner[owner];
    }

    function ensNameOf(address owner) external view returns (string memory) {
        string memory label = creatorLabelOf[owner];
        if (bytes(label).length == 0) return "";
        return string.concat(label, ".copywrite.eth");
    }

    function contentSubname(bytes32 contentHash) external view returns (string memory) {
        Claim memory claim = claims[contentHash];
        if (!claim.exists) return "";
        return string.concat(
            "post-",
            _toHex(contentHash),
            ".",
            claim.creatorLabel,
            ".copywrite.eth"
        );
    }

    function _toHex(bytes32 data) internal pure returns (string memory) {
        bytes16 hexSymbols = "0123456789abcdef";
        bytes memory str = new bytes(64);
        for (uint256 i = 0; i < 32; i++) {
            str[i * 2] = hexSymbols[uint8(data[i] >> 4)];
            str[i * 2 + 1] = hexSymbols[uint8(data[i] & 0x0f)];
        }
        // short label: first 16 hex chars
        bytes memory short = new bytes(16);
        for (uint256 j = 0; j < 16; j++) {
            short[j] = str[j];
        }
        return string(short);
    }
}
