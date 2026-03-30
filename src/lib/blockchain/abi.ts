/**
 * PortraitCert contract ABI (minimal)
 * Deployed on Ethereum Sepolia testnet
 */

export const PORTRAIT_CERT_ABI = [
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

/**
 * Networks supported for certification
 */
export const SUPPORTED_NETWORKS = {
  sepolia: {
    chainId: 11155111,
    name: "Ethereum Sepolia",
    rpcUrl: process.env.ETHEREUM_SEPOLIA_RPC_URL!,
    contractAddress: process.env.PORTRAIT_CERT_CONTRACT_ADDRESS!,
  },
} as const;

export type SupportedNetwork = keyof typeof SUPPORTED_NETWORKS;
