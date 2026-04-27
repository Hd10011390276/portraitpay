// Replace the compareWithAliyun function to use image URLs instead of base64
const fs = require('fs');
const path = 'C:/Users/Administrator/.openclaw/workspace/portraitpay/src/app/api/face/compare/route.ts';
let content = fs.readFileSync(path, 'utf8');

// Find the current compareWithAliyun function
const oldFuncStart = 'async function compareWithAliyun(';
const oldFuncEnd = 'async function compareWithTencent(';

const startIdx = content.indexOf(oldFuncStart);
const endIdx = content.indexOf(oldFuncEnd);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find function boundaries!');
  console.log('startIdx:', startIdx, 'endIdx:', endIdx);
  process.exit(1);
}

const oldFunc = content.substring(startIdx, endIdx);
console.log('Found old function, length:', oldFunc.length);

const newFunc = `async function specialUrlEncode(value: string): Promise<string> {
  return encodeURIComponent(value)
    .replace(/\\+/g, "%20")
    .replace(/\\*/g, "%2A")
    .replace(/~/g, "%7E");
}

async function compareWithAliyun(
  imageUrl1: string,
  imageUrl2: string,
): Promise<{ score: number; result: "PASS" | "FAIL" | "REVIEW"; provider: string }> {
  const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;
  const region = process.env.KYC_ALIYUN_REGION ?? "cn-shanghai";

  if (!accessKeyId || !accessKeySecret) {
    console.warn("[face/compare] Aliyun credentials missing, returning FAIL");
    return { score: 0, result: "FAIL" as const, provider: "aliyun-stub" };
  }

  const host = \`facebody.\${region}.aliyuncs.com\`;
  const action = "CompareFace";
  const version = "2019-12-30";
  const timestamp = new Date().toISOString().replace(/\\.\\d+Z$/, "Z");
  const nonce = crypto.randomUUID();

  // Build query params (alphabetically sorted, as required by POP signing)
  const params = new URLSearchParams({
    SignatureMethod: "HMAC-SHA1",
    SignatureNonce: nonce,
    AccessKeyId: accessKeyId,
    SignatureVersion: "1.0",
    Timestamp: timestamp,
    Format: "JSON",
    RegionId: region,
    Version: version,
    Action: action,
    ImageURL1: imageUrl1,
    ImageURL2: imageUrl2,
  });

  const sortedKeys = Array.from(params.keys()).sort();
  const sortedQueryString = sortedKeys.map(k => \`\${k}=\${params.get(k)}\`).join("&");

  // Build string to sign (POP style)
  const stringToSign = [
    "POST",
    await specialUrlEncode("/"),
    await specialUrlEncode(sortedQueryString),
  ].join("&");

  // HMAC-SHA1 sign
  const key = accessKeySecret + "&";
  const keyBuf = new TextEncoder().encode(key);
  const dataBuf = new TextEncoder().encode(stringToSign);
  const cryptoKey = await crypto.subtle.importKey("raw", keyBuf, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, dataBuf);
  const signature = Buffer.from(sig).toString("base64");
  const encodedSig = await specialUrlEncode(signature);

  // Build final URL with signature
  const url = \`https://\${host}/?Signature=\${encodedSig}&\${sortedQueryString}\`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(\`Aliyun API error \${res.status}: \${text}\`);
  }

  const data = await res.json();
  console.log("[face/compare] Aliyun response:", JSON.stringify(data));
  const similarity = data.Data?.Similarity ?? data.data?.Similarity ?? 0;
  const result: "PASS" | "FAIL" | "REVIEW" =
    similarity >= 80 ? "PASS" : similarity >= 60 ? "REVIEW" : "FAIL";
  return { score: similarity, result, provider: "aliyun" };
}

`;

content = content.substring(0, startIdx) + newFunc + content.substring(endIdx);
fs.writeFileSync(path, content);
console.log("SUCCESS: Replaced compareWithAliyun to use image URLs");
