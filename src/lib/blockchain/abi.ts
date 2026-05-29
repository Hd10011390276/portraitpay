/**
 * PortraitPay Contract ABIs and Network Configuration
 */

export const PORTRAIT_CERT_ABI = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "PortraitCertified",
    "inputs": [
      { "name": "owner", "type": "address", "indexed": true },
      { "name": "ipfsCid", "type": "string", "indexed": false },
      { "name": "imageHash", "type": "bytes32", "indexed": true },
      { "name": "timestamp", "type": "uint256", "indexed": false }
    ],
    "anonymous": false
  },
  {
    "type": "function",
    "name": "certifyPortrait",
    "inputs": [
      { "name": "ipfsCid", "type": "string" },
      { "name": "imageHash", "type": "bytes32" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "verifyPortrait",
    "inputs": [
      { "name": "imageHash", "type": "bytes32" }
    ],
    "outputs": [
      {
        "type": "tuple",
        "components": [
          { "name": "owner", "type": "address" },
          { "name": "ipfsCid", "type": "string" },
          { "name": "imageHash", "type": "bytes32" },
          { "name": "timestamp", "type": "uint256" },
          { "name": "exists", "type": "bool" }
        ]
      }
    ],
    "stateMutability": "view"
  }
] as const;

export const SUPPORTED_NETWORKS = {
  base: {
    chainId: 8453,
    name: "Base Mainnet",
    rpcUrl: process.env.BASE_RPC_URL ?? "https://mainnet.base.org",
    contractAddress: process.env.PORTRAIT_CERT_CONTRACT ?? "0x0000000000000000000000000000000000000000",
    blockExplorer: "https://basescan.org",
    currency: "ETH",
  },
  baseSepolia: {
    chainId: 84532,
    name: "Base Sepolia (Testnet)",
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org",
    contractAddress: process.env.PORTRAIT_CERT_CONTRACT_TEST ?? "0x0000000000000000000000000000000000000000",
    blockExplorer: "https://sepolia.basescan.org",
    currency: "ETH",
  },
} as const;

export type NetworkName = keyof typeof SUPPORTED_NETWORKS;