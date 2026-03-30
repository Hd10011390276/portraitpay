/**
 * S3 / R2 object storage utilities
 * Used for storing original portrait images and thumbnails
 */

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

function getS3Config() {
  return {
    bucket: process.env.AWS_S3_BUCKET!,
    region: process.env.AWS_S3_REGION ?? "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    endpoint: process.env.AWS_ENDPOINT, // Optional: for R2/custom S3
  };
}

/**
 * Generate a unique S3 key for a portrait image
 */
export function generateImageKey(portraitId: string, suffix: "original" | "thumbnail"): string {
  const timestamp = Date.now();
  return `portraits/${portraitId}/${suffix}-${timestamp}.jpg`;
}

/**
 * Get a presigned PUT URL for direct browser-to-S3 upload
 * @param key - S3 object key
 * @param mimeType - Content-Type of the file
 * @param expiresIn - URL expiry in seconds (default 3600)
 */
export async function getPresignedUploadUrl(
  key: string,
  mimeType: string = "image/jpeg",
  expiresIn: number = 3600
): Promise<{ uploadUrl: string; objectUrl: string }> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

  const config = getS3Config();

  const client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    ...(config.endpoint ? { endpoint: config.endpoint } : {}),
  });

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });

  // Public object URL (if bucket is public or through CloudFront)
  const objectUrl = config.endpoint
    ? `${config.endpoint}/${key}`
    : `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;

  return { uploadUrl, objectUrl };
}

/**
 * Get a presigned GET URL for private object access
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

  const config = getS3Config();

  const client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    ...(config.endpoint ? { endpoint: config.endpoint } : {}),
  });

  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Upload a JSON string to S3/R2
 * Returns the IPFS CID (stored as S3 key as IPFS stand-in)
 */
export async function uploadJson(
  content: string,
  key: string
): Promise<string> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const config = getS3Config();

  const client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    ...(config.endpoint ? { endpoint: config.endpoint } : {}),
  });

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ContentType: "application/json",
      Body: Buffer.from(content),
    })
  );

  return key; // 使用 S3 key 作为 CID 替代（实际应上传到 IPFS）
}

/**
 * Upload a Buffer to S3/R2
 * Returns the public URL of the uploaded file
 */
export async function uploadFile(
  buffer: Buffer,
  key: string,
  mimeType: string = "application/octet-stream"
): Promise<string> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const config = getS3Config();

  const client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    ...(config.endpoint ? { endpoint: config.endpoint } : {}),
  });

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ContentType: mimeType,
      Body: buffer,
    })
  );

  if (config.endpoint) {
    return `${config.endpoint}/${key}`;
  }
  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
}

export const storageService = { uploadJson, uploadFile };

/**
 * Delete an object from S3/R2
 */
export async function deleteObject(key: string): Promise<void> {
  const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");

  const config = getS3Config();

  const client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    ...(config.endpoint ? { endpoint: config.endpoint } : {}),
  });

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    })
  );
}
