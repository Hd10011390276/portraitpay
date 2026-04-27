// Replace compareWithTencent to accept image URLs
const fs = require('fs');
const path = 'C:/Users/Administrator/.openclaw/workspace/portraitpay/src/app/api/face/compare/route.ts';
let content = fs.readFileSync(path, 'utf8');

const oldFn = `async function compareWithTencent(
  image1: File,
  image2: File,
): Promise<{ score: number; result: "PASS" | "FAIL" | "REVIEW"; provider: string }> {
  const secretId = process.env.KYC_TENCENT_SECRET_ID;
  const secretKey = process.env.KYC_TENCENT_SECRET_KEY;
  const region = process.env.KYC_TENCENT_REGION ?? "ap-guangzhou";
  const appId = process.env.KYC_TENCENT_APP_ID;

  if (!secretId || !secretKey || !appId) {
    console.warn("[face/compare] Tencent credentials missing, returning FAIL");
    return { score: 0, result: "FAIL" as const, provider: "tencent-stub" };
  }

  const portraitBase64 = await fileToBase64(image1);
  const idCardBase64 = await fileToBase64(image2);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = Math.floor(Math.random() * 99999999).toString();

  const host = "faceid.faceid.tencentcloudapi.com";
  const action = "CompareFace";
  const version = "2018-03-01";
  const payload = JSON.stringify({ ImageA: portraitBase64, ImageB: idCardBase64 });`;

const newFn = `async function compareWithTencent(
  imageUrl1: string,
  imageUrl2: string,
): Promise<{ score: number; result: "PASS" | "FAIL" | "REVIEW"; provider: string }> {
  const secretId = process.env.KYC_TENCENT_SECRET_ID;
  const secretKey = process.env.KYC_TENCENT_SECRET_KEY;
  const region = process.env.KYC_TENCENT_REGION ?? "ap-guangzhou";

  if (!secretId || !secretKey) {
    console.warn("[face/compare] Tencent credentials missing, returning FAIL");
    return { score: 0, result: "FAIL" as const, provider: "tencent-stub" };
  }

  // Fetch images from URLs and convert to base64
  const [buf1, buf2] = await Promise.all([
    fetch(imageUrl1).then(r => r.arrayBuffer()),
    fetch(imageUrl2).then(r => r.arrayBuffer()),
  ]);
  const portraitBase64 = Buffer.from(buf1).toString("base64");
  const idCardBase64 = Buffer.from(buf2).toString("base64");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = Math.floor(Math.random() * 99999999).toString();

  const host = "faceid.faceid.tencentcloudapi.com";
  const action = "CompareFace";
  const version = "2018-03-01";
  const payload = JSON.stringify({ ImageA: portraitBase64, ImageB: idCardBase64 });`;

if (!content.includes(oldFn)) {
  console.error("Could not find compareWithTencent function to replace!");
  process.exit(1);
}

content = content.replace(oldFn, newFn);
fs.writeFileSync(path, content);
console.log("SUCCESS: Replaced compareWithTencent");
