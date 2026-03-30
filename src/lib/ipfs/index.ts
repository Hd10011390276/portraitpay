/**
 * IPFS utilities for PortraitPay
 * Uses Pinata as the IPFS pinning service
 */

export interface IpfsUploadResult {
  cid: string;
  url: string; // ipfs://Qm... or gateway URL
  size: number;
  name: string;
}

export interface PortraitMetadata {
  name: string;
  description?: string;
  image: string; // ipfs://Qm... of the image
  owner: string; // wallet address
  category: string;
  tags: string[];
  certifiedAt: string; // ISO 8601
  blockchain: {
    network: string;
    txHash: string;
    contractAddress: string;
  };
  originalImageHash: string;
}

/**
 * Upload a file to IPFS via Pinata REST API
 */
export async function uploadToIpfs(
  data: Buffer,
  fileName: string,
  mimeType: string = "image/jpeg"
): Promise<IpfsUploadResult> {
  const apiKey = process.env.PINATA_API_KEY;
  const secretKey = process.env.PINATA_SECRET_API_KEY;

  if (!apiKey || !secretKey) {
    throw new Error("Pinata API keys not configured. Set PINATA_API_KEY and PINATA_SECRET_API_KEY in .env");
  }

  const formData = new FormData();
  const blob = new Blob([data], { type: mimeType });
  formData.append("file", blob, fileName);

  // Pinata metadata
  const metadata = JSON.stringify({
    name: fileName,
  });
  formData.append("pinataMetadata", metadata);

  // Pinata options (optional: add custom duration)
  const options = JSON.stringify({
    cidVersion: 1, // Use CIDv1 for better compatibility
  });
  formData.append("pinataOptions", options);

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      pinata_api_key: apiKey,
      pinata_secret_api_key: secretKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`IPFS upload failed: ${response.status} ${error}`);
  }

  const result = await response.json();

  return {
    cid: result.IpfsHash,
    url: `ipfs://${result.IpfsHash}`,
    size: result.PinSize,
    name: fileName,
  };
}

/**
 * Upload JSON metadata to IPFS
 */
export async function uploadJsonToIpfs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: PortraitMetadata | Record<string, any>,
  fileName: string
): Promise<IpfsUploadResult> {
  const apiKey = process.env.PINATA_API_KEY;
  const secretKey = process.env.PINATA_SECRET_API_KEY;

  if (!apiKey || !secretKey) {
    throw new Error("Pinata API keys not configured.");
  }

  const jsonBuffer = Buffer.from(JSON.stringify(metadata, null, 2));

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      pinata_api_key: apiKey,
      pinata_secret_api_key: secretKey,
      "Content-Type": "application/json",
    },
    body: jsonBuffer,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`IPFS JSON upload failed: ${response.status} ${error}`);
  }

  const result = await response.json();

  return {
    cid: result.IpfsHash,
    url: `ipfs://${result.IpfsHash}`,
    size: result.PinSize,
    name: fileName,
  };
}

/**
 * Get a public IPFS gateway URL for a CID
 * Prefer Cloudflare IPFS gateway for speed
 */
export function getIpfsGatewayUrl(cid: string, gateway: "cloudflare" | "pinata" | "ipfsio" = "cloudflare"): string {
  const gateways = {
    cloudflare: `https://cloudflare-ipfs.com/ipfs/${cid}`,
    pinata: `https://gateway.pinata.cloud/ipfs/${cid}`,
    ipfsio: `https://ipfs.io/ipfs/${cid}`,
  };
  return gateways[gateway];
}

/**
 * Fetch JSON metadata from IPFS
 */
export async function fetchMetadataFromIpfs<T>(cid: string): Promise<T> {
  const url = getIpfsGatewayUrl(cid);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch IPFS metadata: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Build portrait metadata JSON (according to SPEC.md schema)
 */
export function buildPortraitMetadata(
  portrait: {
    id: string;
    title: string;
    description?: string | null;
    category: string;
    tags: string[];
    owner: { walletAddress?: string | null };
    imageHash: string;
    ipfsCid: string;
    blockchainTxHash: string | null;
    certifiedAt: Date | null;
  },
  contractAddress: string,
  network: string = "sepolia"
): PortraitMetadata {
  return {
    name: portrait.title,
    description: portrait.description ?? undefined,
    image: portrait.ipfsCid ? `ipfs://${portrait.ipfsCid}` : "",
    owner: portrait.owner.walletAddress ?? "",
    category: portrait.category,
    tags: portrait.tags,
    certifiedAt: portrait.certifiedAt?.toISOString() ?? new Date().toISOString(),
    blockchain: {
      network,
      txHash: portrait.blockchainTxHash ?? "",
      contractAddress,
    },
    originalImageHash: portrait.imageHash ?? "",
  };
}
