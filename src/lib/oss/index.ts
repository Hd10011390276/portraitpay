/**
 * Aliyun OSS utilities for KYC image storage
 * Used for storing portrait and ID card images that need to be accessible to Aliyun CompareFace API
 */
import OSS from 'ali-oss';

let client: OSS | null = null;

export interface OssUploadResult {
  url: string;       // Full OSS signed URL
  objectKey: string; // OSS object key
  size: number;
}

/**
 * Get or create the OSS client (singleton)
 * Reuses KYC_ALIYUN credentials if dedicated OSS credentials are not set.
 */
function getOssClient(): OSS {
  if (!client) {
    const bucket = process.env.ALIYUN_OSS_BUCKET;
    const region = process.env.ALIYUN_OSS_REGION || 'oss-cn-shanghai';
    
    if (!bucket) {
      throw new Error('ALIYUN_OSS_BUCKET is not configured. Please set ALIYUN_OSS_BUCKET, ALIYUN_OSS_REGION, ALIYUN_OSS_ACCESS_KEY_ID, and ALIYUN_OSS_ACCESS_KEY_SECRET in Vercel environment variables.');
    }
    
    // Reuse KYC Aliyun credentials if dedicated OSS credentials not set
    const accessKeyId = process.env.ALIYUN_OSS_ACCESS_KEY_ID || process.env.KYC_ALIYUN_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALIYUN_OSS_ACCESS_KEY_SECRET || process.env.KYC_ALIYUN_ACCESS_KEY_SECRET;
    
    if (!accessKeyId || !accessKeySecret) {
      throw new Error('Aliyun OSS credentials not configured. Set ALIYUN_OSS_ACCESS_KEY_ID and ALIYUN_OSS_ACCESS_KEY_SECRET (or reuse KYC_ALIYUN credentials).');
    }
    
    client = new OSS({
      region,
      accessKeyId,
      accessKeySecret,
      bucket,
      secure: true,
    });
  }
  return client;
}

/**
 * Upload a buffer to Aliyun OSS and return a signed URL (1 hour expiry)
 * The signed URL allows Aliyun CompareFace API to download the image
 */
export async function uploadToOss(
  buffer: Buffer,
  objectKey: string,
  mimeType: string = 'image/jpeg'
): Promise<OssUploadResult> {
  const ossClient = getOssClient();
  
  await ossClient.put(objectKey, buffer, {
    mime: mimeType,
  });
  
  // Generate a signed URL valid for 1 hour (3600 seconds)
  // This is the URL we'll pass to Aliyun CompareFace
  const signedUrl = ossClient.signatureUrl(objectKey, { expires: 3600 });
  
  return {
    url: signedUrl,
    objectKey,
    size: buffer.length,
  };
}

/**
 * Generate a presigned URL for an existing OSS object (1 hour expiry)
 */
export function getOssSignedUrl(objectKey: string, expiresSeconds: number = 3600): string {
  const ossClient = getOssClient();
  return ossClient.signatureUrl(objectKey, { expires: expiresSeconds });
}

/**
 * Generate a unique OSS key for KYC images
 */
export function generateKycImageKey(portraitId: string, type: 'portrait' | 'idcard'): string {
  const timestamp = Date.now();
  return `kyc/${portraitId}/${type}-${timestamp}.jpg`;
}