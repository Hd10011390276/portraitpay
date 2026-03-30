/**
 * Blockchain utilities for PortraitPay
 * Handles: wallet connection, contract interaction, tx monitoring
 */

import { ethers } from "ethers";
import { PORTRAIT_CERT_ABI, SUPPORTED_NETWORKS } from "./abi";
export { SUPPORTED_NETWORKS };

export interface CertificationResult {
  txHash: string;
  blockNumber: number;
  blockHash: string;
  gasUsed: string;
  network: string;
  certifiedAt: Date;
}

export interface OnChainPortraitRecord {
  owner: string;
  ipfsCid: string;
  imageHash: string;
  timestamp: Date;
  exists: boolean;
}

/**
 * Create a ethers.js Wallet instance from private key
 */
export function getSigner(network: keyof typeof SUPPORTED_NETWORKS = "sepolia") {
  const config = SUPPORTED_NETWORKS[network];
  if (!config) throw new Error(`Unsupported network: ${network}`);

  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(process.env.ETH_WALLET_PRIVATE_KEY!, provider);
  return wallet;
}

/**
 * Get a read-only provider for verifying data on-chain
 */
export function getProvider(network: keyof typeof SUPPORTED_NETWORKS = "sepolia") {
  const config = SUPPORTED_NETWORKS[network];
  if (!config) throw new Error(`Unsupported network: ${network}`);
  return new ethers.JsonRpcProvider(config.rpcUrl);
}

/**
 * Get contract instance (read-write)
 */
export function getContract(network: keyof typeof SUPPORTED_NETWORKS = "sepolia") {
  const config = SUPPORTED_NETWORKS[network];
  if (!config) throw new Error(`Unsupported network: ${network}`);

  const signer = getSigner(network);
  return new ethers.Contract(config.contractAddress, PORTRAIT_CERT_ABI, signer);
}

/**
 * Get contract instance (read-only)
 */
export function getContractReadOnly(network: keyof typeof SUPPORTED_NETWORKS = "sepolia") {
  const config = SUPPORTED_NETWORKS[network];
  if (!config) throw new Error(`Unsupported network: ${network}`);

  const provider = getProvider(network);
  return new ethers.Contract(config.contractAddress, PORTRAIT_CERT_ABI, provider);
}

/**
 * Certify a portrait on the blockchain
 * @param ipfsCid - IPFS CID of the portrait metadata
 * @param imageHash - SHA-256 hash of the original image (as hex string)
 * @param network - Network to use
 * @returns CertificationResult with tx details
 */
export async function certifyPortrait(
  ipfsCid: string,
  imageHash: string,
  network: keyof typeof SUPPORTED_NETWORKS = "sepolia"
): Promise<CertificationResult> {
  const contract = getContract(network);

  // Convert hex string to bytes32
  const imageHashBytes32 = ethers.zeroPadValue("0x" + imageHash.replace(/^0x/, ""), 32);

  console.log(`[Blockchain] Certifying portrait on ${network}...`);
  console.log(`  IPFS CID: ${ipfsCid}`);
  console.log(`  Image Hash: ${imageHash}`);

  // Send transaction
  const tx = await contract.certifyPortrait(ipfsCid, imageHashBytes32, {
    gasLimit: 200000,
  });

  console.log(`[Blockchain] Tx submitted: ${tx.hash}`);

  // Wait for confirmation (1 block)
  const receipt = await tx.wait(1);

  const result: CertificationResult = {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    blockHash: receipt.blockHash,
    gasUsed: receipt.gasUsed.toString(),
    network,
    certifiedAt: new Date(),
  };

  console.log(`[Blockchain] ✅ Certified! Block #${receipt.blockNumber}`);

  return result;
}

/**
 * Verify a portrait exists on-chain
 * @param imageHash - SHA-256 hash of the image (hex string without 0x prefix)
 */
export async function verifyPortraitOnChain(
  imageHash: string,
  network: keyof typeof SUPPORTED_NETWORKS = "sepolia"
): Promise<OnChainPortraitRecord | null> {
  const contract = getContractReadOnly(network);

  const imageHashBytes32 = ethers.zeroPadValue("0x" + imageHash.replace(/^0x/, ""), 32);

  const record = await contract.verifyPortrait(imageHashBytes32);

  if (!record.exists) return null;

  return {
    owner: record.owner,
    ipfsCid: record.ipfsCid,
    imageHash: record.imageHash,
    timestamp: new Date(Number(record.timestamp) * 1000),
    exists: record.exists,
  };
}

/**
 * Compute SHA-256 hash of a file (Buffer)
 * Returns hex string WITHOUT 0x prefix (solidity bytes32 compatible)
 */
export async function computeImageHash(fileBuffer: Buffer): Promise<string> {
  const { createHash } = await import("crypto");
  const hash = createHash("sha256").update(fileBuffer).digest("hex");
  return hash; // no 0x prefix for solidity bytes32
}

/**
 * Get current Sepolia gas price
 */
export async function getSepoliaGasPrice(): Promise<string> {
  const provider = getProvider("sepolia");
  const feeData = await provider.getFeeData();
  return feeData.gasPrice?.toString() ?? "0";
}
