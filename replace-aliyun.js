// This script replaces the compareWithAliyun function in the route file
const fs = require('fs');
const path = 'C:/Users/Administrator/.openclaw/workspace/portraitpay/src/app/api/face/compare/route.ts';
let content = fs.readFileSync(path, 'utf8');

// Find and replace compareWithAliyun function
const oldFunc = `async function compareWithAliyun(
  image1: File,
  image2: File,
): Promise<{ score: number; result: "PASS" | "FAIL" | "REVIEW"; provider: string }> {
  const accessKeyId = process.env.KYC_ALIYUN_ACCESS_KEY_ID;
  const accessKeySecret = process.env.KYC_ALIYUN_ACCESS_KEY_SECRET;
  const region = process.env.KYC_ALIYUN_REGION ?? "cn-shanghai";
  const appId = process.env.KYC_ALIYUN_APP_ID;

  if (!accessKeyId || !accessKeySecret || !appId) {
    console.warn("[face/compare] Aliyun credentials missing, returning FAIL");
    return { score: 0, result: "FAIL" as const, provider: "aliyun-stub" };
  }

  const portraitBase64 = await fileToBase64(image1);
  const idCardBase64 = await fileToBase64(image2);

  const host = \`faceverification.\${region}.aliyuncs.com\`;
  const body = JSON.stringify({
    ProductKey: appId,
    VerificationType: "FACECOMPARE",
    CompareImageList: [
      { ImageBase64: portraitBase64, ImageType: "BASE64" },
      { ImageBase64: idCardBase64, ImageType: "BASE64" },
    ],
    BizDuration: 600,
  });

  const headers = {
    "Content-Type": "application/json",
    "X-Acs-Version": "2021-09-30",
    "X-Acs-Action": "Verify",
  };

  const authHeader = await signAliyunRequest({
    method: "POST",
    host,
    path: "/",
    headers,
    body,
    accessKeyId,
    accessKeySecret,
  });

  const res = await fetch(\`https://\${host}/\`, {
    method: "POST",
    headers: { ...headers, Authorization: authHeader },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(\`Aliyun API error \${res.status}: \${text}\`);
  }

  const data = await res.json();
  const similarity = data.Data?.Similarity ?? data.Data?.verifyScore ?? 0;
  const result = data.Data?.VerifyResult ?? data.Data?.verifyResult ?? "FAIL";
  return { score: similarity, result: result as "PASS" | "FAIL" | "REVIEW", provider: "aliyun" };
}`;

const newFunc = `async function specialUrlEncode(value: string): Promise<string> {
  return encodeURIComponent(value)
    .replace(/\\+/g, "%20")
    .replace(/\\*/g, "%2A")
    .replace(/~/g, "%7E");
}

async function compareWithAliyun(
  image1: File,
  image2: File,
): Promise<{ score: number; result: "PASS" | "FAIL" | "REVIEW"; provider: string }> {
  const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;
  const region = process.env.KYC_ALIYUN_REGION ?? "cn-shanghai";

  if (!accessKeyId || !accessKeySecret) {
    console.warn("[face/compare] Aliyun credentials missing, returning FAIL");
    return { score: 0, result: "FAIL" as const, provider: "aliyun-stub" };
  }

  const portraitBase64 = await fileToBase64(image1);
  const idCardBase64 = await fileToBase64(image2);

  const host = \`facebody.\${region}.aliyuncs.com\`;
  const action = "CompareFace";
  const version = "2019-12-30";
  const timestamp = new Date().toISOString().replace(/\\.\\d+Z$/, "Z");
  const nonce = crypto.randomUUID();

  // Build query string (alphabetically sorted, as required by POP signing)
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
    ImageURL1: \`data:image/jpeg;base64,\${portraitBase64}\`,
    ImageURL2: \`data:image/jpeg;base64,\${idCardBase64}\`,
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
  const similarity = data.Data?.Similarity ?? data.data?.Similarity ?? 0;
  const result: "PASS" | "FAIL" | "REVIEW" =
    similarity >= 80 ? "PASS" : similarity >= 60 ? "REVIEW" : "FAIL";
  return { score: similarity, result, provider: "aliyun" };
}`;

if (!content.includes(oldFunc)) {
  console.error("ERROR: Could not find old function to replace!");
  console.log("Looking for:", oldFunc.substring(0, 100));
  process.exit(1);
}

content = content.replace(oldFunc, newFunc);
fs.writeFileSync(path, content);
console.log("SUCCESS: Replaced compareWithAliyun function");
