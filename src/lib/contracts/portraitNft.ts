/**
 * PortraitCert Contract Client Library (ethers.js v6)
 *
 * Client-side library for interacting with the PortraitCert contract on Sepolia.
 * Environment variables:
 *   NEXT_PUBLIC_CONTRACT_ADDRESS  — deployed PortraitCert contract address (client-safe)
 *   NEXT_PUBLIC_SEPOLIA_RPC_URL   — Sepolia RPC URL for read-only providers (client-safe)
 *
 * Server-side env (never exposed to client):
 *   SEPOLIA_RPC_URL              — Sepolia RPC URL for signer providers
 *   PRIVATE_KEY                   — Burner wallet private key (server-only)
 *
 * Contract deployed on Ethereum Sepolia testnet (chainId: 11155111)
 */

import { ethers } from "ethers";

// ─── ABI ───────────────────────────────────────────────────────────────────

export const PORTRAIT_NFT_ABI = [
  // certifyPortrait — mint a portrait record on-chain
  {
    inputs: [
      { internalType: "string", name: "ipfsCid", type: "string" },
      { internalType: "bytes32", name: "imageHash", type: "bytes32" },
    ],
    name: "certifyPortrait",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // verifyPortrait — look up a portrait record by image hash
  {
    inputs: [{ internalType: "bytes32", name: "imageHash", type: "bytes32" }],
    name: "verifyPortrait",
    outputs: [
      {
        components: [
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "string", name: "ipfsCid", type: "string" },
          { internalType: "bytes32", name: "imageHash", type: "bytes32" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "bool", name: "exists", type: "bool" },
        ],
        internalType: "struct PortraitCert.PortraitRecord",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // PortraitCertified event
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: true, internalType: "bytes32", name: "imageHash", type: "bytes32" },
      { indexed: false, internalType: "string", name: "ipfsCid", type: "string" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "PortraitCertified",
    type: "event",
  },
] as const;

// ─── Config ─────────────────────────────────────────────────────────────────

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  process.env.NEXT_PUBLIC_PORTRAIT_CERT_ADDRESS ??
  "";

const SEPOLIA_RPC_URL =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ??
  process.env.NEXT_PUBLIC_SEPOLIA_RPC ??
  "https://sepolia.infura.io/v3/";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OnChainPortraitRecord {
  owner: string;
  ipfsCid: string;
  imageHash: string;
  timestamp: Date;
  exists: boolean;
}

export interface MintResult {
  txHash: string;
  blockNumber: number;
  ipfsCid: string;
  imageHash: string;
  network: "sepolia";
}

// ─── Browser Ethereum Provider ───────────────────────────────────────────────

/**
 * Request MetaMask / browser wallet connection.
 * Returns the BrowserProvider from ethers.js v6.
 */
export async function getBrowserProvider(): Promise<ethers.BrowserProvider> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error(
      "Ethereum wallet not detected. Please install MetaMask or use a wallet-compatible browser."
    );
  }
  await window.ethereum.request({ method: "eth_requestAccounts" });
  return new ethers.BrowserProvider(window.ethereum);
}

/**
 * Get a signer contract instance (connected to wallet).
 * Requires wallet connection — will prompt user to connect.
 */
export async function getSignerContract(): Promise<ethers.Contract> {
  const provider = await getBrowserProvider();
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, PORTRAIT_NFT_ABI, signer);
}

// ─── Contract Functions ─────────────────────────────────────────────────────

/**
 * mintPortrait — certify a portrait on the Sepolia blockchain.
 *
 * @param ipfsCid   IPFS CID of the portrait metadata JSON
 * @param imageHash SHA-256 hash of the original image (64-char hex string WITHOUT 0x prefix)
 * @returns MintResult with txHash, blockNumber, ipfsCid, imageHash
 */
export async function mintPortrait(
  ipfsCid: string,
  imageHash: string
): Promise<MintResult> {
  const contract = await getSignerContract();
  const paddedHash = ethers.zeroPadValue("0x" + imageHash.replace(/^0x/, ""), 32);

  console.log(`[PortraitNft] Minting portrait on Sepolia...`);
  console.log(`  Contract: ${CONTRACT_ADDRESS}`);
  console.log(`  IPFS CID:  ${ipfsCid}`);
  console.log(`  Image Hash: 0x${imageHash}`);

  const tx = await contract.certifyPortrait(ipfsCid, paddedHash);
  console.log(`[PortraitNft] Tx submitted: ${tx.hash}`);

  const receipt = await tx.wait(1);
  console.log(`[PortraitNft] ✅ Minted! Block #${receipt.blockNumber}`);

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    ipfsCid,
    imageHash,
    network: "sepolia",
  };
}

/**
 * transferPortrait — placeholder for future contract upgrade.
 */
export async function transferPortrait(
  _imageHash: string,
  _newOwner: string
): Promise<{ txHash: string }> {
  throw new Error(
    "transferPortrait is not available in the current contract. " +
    "A contract upgrade is required to support ownership transfer."
  );
}

/**
 * setLicense — placeholder for future contract upgrade.
 */
export async function setLicense(
  _imageHash: string,
  _licenseTerms: string
): Promise<{ txHash: string }> {
  throw new Error(
    "setLicense is not available in the current contract. " +
    "Licensing is managed via PortraitPay's off-chain licensing system."
  );
}

/**
 * grantLicense — placeholder for future contract upgrade.
 */
export async function grantLicense(
  _imageHash: string,
  _licensee: string,
  _scope: string,
  _fee: bigint
): Promise<{ txHash: string }> {
  throw new Error(
    "grantLicense is not available in the current contract. " +
    "License grants are managed via PortraitPay's off-chain licensing system."
  );
}

/**
 * verifyPortraitOnChain — check if a portrait exists on-chain.
 */
export async function verifyPortraitOnChain(
  imageHash: string
): Promise<OnChainPortraitRecord | null> {
  try {
    const roProvider = new ethers.JsonRpcProvider(
      SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/"
    );
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      PORTRAIT_NFT_ABI,
      roProvider
    );
    const paddedHash = ethers.zeroPadValue("0x" + imageHash.replace(/^0x/, ""), 32);
    const record = await contract.verifyPortrait(paddedHash);
    if (!record.exists) return null;
    return {
      owner: record.owner,
      ipfsCid: record.ipfsCid,
      imageHash: record.imageHash,
      timestamp: new Date(Number(record.timestamp) * 1000),
      exists: record.exists,
    };
  } catch (err) {
    console.error("[PortraitNft] verifyPortraitOnChain error:", err);
    return null;
  }
}

/**
 * computeImageHash — compute SHA-256 hash of a File/Blob in the browser.
 * Returns a 64-char hex string WITHOUT 0x prefix.
 */
export async function computeImageHash(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * Check if MetaMask or a compatible wallet is available.
 */
export function hasWallet(): boolean {
  return typeof window !== "undefined" && !!window.ethereum;
}

// ─── Global type augmentation for window.ethereum ────────────────────────────

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}
