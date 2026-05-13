/**
 * PortraitCert contract ABI (minimal)
 * Deployed on Ethereum Sepolia testnet (chainId: 11155111)
 * For Base Mainnet deployment, use LICENSING_CONTRACT_ABI below.
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
  base: {
    chainId: 8453,
    name: "Base Mainnet",
    rpcUrl: process.env.BASE_MAINNET_RPC_URL!,
    contractAddress: process.env.LICENSING_CONTRACT_ADDRESS!,
  },
} as const;

export type SupportedNetwork = keyof typeof SUPPORTED_NETWORKS;

/**
 * Licensing Contract ABI (for Base Mainnet)
 * Handles portrait licensing and royalty distribution
 */
export const LICENSING_CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "_portraitId", type: "uint256" },
      { internalType: "address", name: "_licensee", type: "address" },
      { internalType: "uint256", name: "_fee", type: "uint256" },
      { internalType: "string", name: "_usageScope", type: "string" },
    ],
    name: "createLicense",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_licenseId", type: "uint256" }],
    name: "getLicense",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "licenseId", type: "uint256" },
          { internalType: "uint256", name: "portraitId", type: "uint256" },
          { internalType: "address", name: "licensee", type: "address" },
          { internalType: "uint256", name: "fee", type: "uint256" },
          { internalType: "string", name: "usageScope", type: "string" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "bool", name: "active", type: "bool" },
        ],
        internalType: "struct Licensing.License",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_licenseId", type: "uint256" }],
    name: "revokeLicense",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_portraitId", type: "uint256" },
      { internalType: "address", name: "_creator", type: "address" },
    ],
    name: "registerPortrait",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_portraitId", type: "uint256" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
    ],
    name: "payRoyalty",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_portraitId", type: "uint256" }],
    name: "getRoyaltyInfo",
    outputs: [
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "uint256", name: "totalRoyalty", type: "uint256" },
      { internalType: "uint256", name: "platformFee", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PLATFORM_FEE_PERCENT",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "licenseId", type: "uint256" },
      { indexed: true, internalType: "uint256", name: "portraitId", type: "uint256" },
      { indexed: false, internalType: "address", name: "licensee", type: "address" },
      { indexed: false, internalType: "uint256", name: "fee", type: "uint256" },
    ],
    name: "LicenseCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "licenseId", type: "uint256" },
      { indexed: false, internalType: "address", name: "revokedBy", type: "address" },
    ],
    name: "LicenseRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "portraitId", type: "uint256" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "uint256", name: "royaltyAmount", type: "uint256" },
    ],
    name: "RoyaltyPaid",
    type: "event",
  },
] as const;
