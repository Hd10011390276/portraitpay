// Fix: compareWithCloudProvider passes File objects, compareWithAliyun must handle upload to R2
const fs = require('fs');
const path = 'C:/Users/Administrator/.openclaw/workspace/portraitpay/src/app/api/face/compare/route.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace compareWithCloudProvider to just call Aliyun with File objects
const oldCloudProvider = `async function compareWithCloudProvider(
  image1: File,
  image2: File,
  threshold: number,
): Promise<{ score: number; result: "PASS" | "FAIL" | "REVIEW"; provider: string }> {
  const provider = process.env.KYC_PROVIDER ?? "aliyun";

  if (provider === "aliyun") {
    return compareWithAliyun(image1, image2);
  } else if (provider === "tencent") {
    return compareWithTencent(image1, image2);
  }

  // No cloud credentials configured — fail closed instead of fake pass
  console.warn("[face/compare] No cloud credentials configured, returning FAIL");
  return { score: 0, result: "FAIL" as const, provider: "stub" };
}`;

const newCloudProvider = `async function compareWithCloudProvider(
  image1: File,
  image2: File,
  threshold: number,
): Promise<{ score: number; result: "PASS" | "FAIL" | "REVIEW"; provider: string }> {
  // Upload files to R2 to get public URLs
  const { uploadFile } = await import("@/lib/storage");
  const buf1 = Buffer.from(await image1.arrayBuffer());
  const buf2 = Buffer.from(await image2.arrayBuffer());
  const key1 = \`temp/face/\${Date.now()}-portrait.jpg\`;
  const key2 = \`temp/face/\${Date.now()}-idcard.jpg\`;
  const [url1, url2] = await Promise.all([
    uploadFile(buf1, key1, image1.type || "image/jpeg"),
    uploadFile(buf2, key2, image2.type || "image/jpeg"),
  ]);
  console.log("[face/compare] R2 URLs:", url1, url2);

  const provider = process.env.KYC_PROVIDER ?? "aliyun";
  if (provider === "aliyun") {
    return compareWithAliyun(url1, url2);
  } else if (provider === "tencent") {
    return compareWithTencent(url1, url2);
  }

  console.warn("[face/compare] No cloud credentials configured, returning FAIL");
  return { score: 0, result: "FAIL" as const, provider: "stub" };
}`;

if (!content.includes(oldCloudProvider)) {
  console.error("Could not find compareWithCloudProvider function!");
  process.exit(1);
}

content = content.replace(oldCloudProvider, newCloudProvider);
fs.writeFileSync(path, content);
console.log("SUCCESS: Fixed compareWithCloudProvider");
