// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * PortraitCert — Blockchain portrait certification contract
 * Deployed on Ethereum Sepolia testnet
 *
 * Deployment:
 *   npx hardhat compile
 *   npx hardhat deploy --network sepolia
 *
 * Verify on Etherscan:
 *   npx hardhat verify --network sepolia <deployed-address>
 */

contract PortraitCert {
    struct PortraitRecord {
        address owner;
        string ipfsCid;       // IPFS CID of metadata JSON
        bytes32 imageHash;    // SHA-256 of original image
        uint256 timestamp;    // Block timestamp
        bool exists;
    }

    // imageHash (SHA-256) → PortraitRecord
    mapping(bytes32 => PortraitRecord) public portraits;

    // owner → array of image hashes they certified
    mapping(address => bytes32[]) public ownerPortraits;

    event PortraitCertified(
        address indexed owner,
        bytes32 indexed imageHash,
        string ipfsCid,
        uint256 timestamp
    );

    /**
     * @notice Certify a portrait on-chain
     * @param ipfsCid  IPFS CID of the metadata JSON
     * @param imageHash SHA-256 hash of the original image (as bytes32)
     */
    function certifyPortrait(
        string calldata ipfsCid,
        bytes32 imageHash
    ) external returns (bytes32) {
        require(!portraits[imageHash].exists, "Already certified");
        require(bytes(ipfsCid).length > 0, "IPFS CID required");
        require(msg.sender != address(0), "Invalid sender");

        portraits[imageHash] = PortraitRecord({
            owner: msg.sender,
            ipfsCid: ipfsCid,
            imageHash: imageHash,
            timestamp: block.timestamp,
            exists: true
        });

        ownerPortraits[msg.sender].push(imageHash);

        emit PortraitCertified(msg.sender, imageHash, ipfsCid, block.timestamp);

        return imageHash;
    }

    /**
     * @notice Verify a portrait exists on-chain
     * @param imageHash SHA-256 hash of the image
     */
    function verifyPortrait(bytes32 imageHash)
        external
        view
        returns (PortraitRecord memory)
    {
        require(portraits[imageHash].exists, "Not found");
        return portraits[imageHash];
    }

    /**
     * @notice Get all portrait hashes certified by an owner
     */
    function getOwnerPortraitCount(address owner) external view returns (uint256) {
        return ownerPortraits[owner].length;
    }
}
