/**
 * Server-side face comparison — accepts image URLs, fetches them,
 * converts to Base64, and calls cloud provider for 1:1 matching.
 */
export interface FaceCompareResult {
  score: number;
  result: "PASS" | "FAIL" | "REVIEW";
  provider: string;
  confidenceInterval: [number, number];
  method: string;
}

export async function compareFacesByUrl(
  urlA: string,
  urlB: string,
): Promise<FaceCompareResult> {
  // Stub mode — skip image fetch
  const provider = process.env.KYC_PROVIDER ?? "aliyun";
  const stubEnabled =
    provider === "aliyun" ? process.env.KYC_ALIYUN_STUB === "true" :
    provider === "tencent" ? (!process.env.KYC_TENCENT_SECRET_ID || !process.env.KYC_TENCENT_SECRET_KEY) :
    false;

  if (stubEnabled) return stubCompare();

  const [base64A, base64B] = await Promise.all([
    fetchImageAsBase64(urlA),
    fetchImageAsBase64(urlB),
  ]);

  return compareFacesFromBase64(base64A, base64B);
}

async function fetchImageAsBase64(url: string): Promise<string> {
  // Convert relative paths to absolute URLs for local dev
  if (url.startsWith("/")) {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";
    url = `${base.replace(/\/$/, "")}${url}`;
  }
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return buffer.toString("base64");
}

async function compareFacesFromBase64(
  base64A: string,
  base64B: string,
): Promise<FaceCompareResult> {
  const provider = process.env.KYC_PROVIDER ?? "aliyun";
  if (provider === "aliyun") return aliyunCompare(base64A, base64B);
  if (provider === "tencent") return tencentCompare(base64A, base64B);
  throw new Error(`Unsupported KYC provider: ${provider}`);
}

// ── Aliyun ──────────────────────────────────────────────────
async function aliyunCompare(
  base64A: string,
  base64B: string,
): Promise<FaceCompareResult> {
  const accessKeyId = process.env.KYC_ALIYUN_ACCESS_KEY_ID;
  const accessKeySecret = process.env.KYC_ALIYUN_ACCESS_KEY_SECRET;
  const region = process.env.KYC_ALIYUN_REGION ?? "cn-shanghai";
  const appId = process.env.KYC_ALIYUN_APP_ID;

  if (!accessKeyId || !accessKeySecret || !appId) return stubCompare();

  const host = `faceverification.${region}.aliyuncs.com`;
  const body = JSON.stringify({
    ProductKey: appId,
    VerificationType: "FACECOMPARE",
    CompareImageList: [
      { ImageBase64: base64A, ImageType: "BASE64" },
      { ImageBase64: base64B, ImageType: "BASE64" },
    ],
    BizDuration: 600,
  });

  const headers = {
    "Content-Type": "application/json",
    "X-Acs-Version": "2021-09-30",
    "X-Acs-Action": "Verify",
  };

  const authHeader = await signAliyunRequest({
    method: "POST", host, path: "/", headers, body, accessKeyId, accessKeySecret,
  });

  const res = await fetch(`https://${host}/`, {
    method: "POST",
    headers: { ...headers, Authorization: authHeader },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Aliyun face verify error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const score = data.Data?.Similarity ?? data.Data?.verifyScore ?? 0;
  const result = data.Data?.VerifyResult ?? data.Data?.verifyResult ?? "FAIL";

  return {
    score,
    result,
    provider: "aliyun",
    confidenceInterval: confidenceBounds(score),
    method: "Aliyun Face Verify v2021-09-30",
  };
}

// ── Tencent ─────────────────────────────────────────────────
async function tencentCompare(
  base64A: string,
  base64B: string,
): Promise<FaceCompareResult> {
  const secretId = process.env.KYC_TENCENT_SECRET_ID;
  const secretKey = process.env.KYC_TENCENT_SECRET_KEY;
  const appId = process.env.KYC_TENCENT_APP_ID;

  if (!secretId || !secretKey || !appId) return stubCompare();

  const host = "faceid.tencentcloudapi.com";
  const action = "CompareFace";
  const version = "2018-03-01";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = Math.floor(Math.random() * 99999999).toString();
  const payload = JSON.stringify({ ImageA: base64A, ImageB: base64B });

  const signature = await tencentSign({
    secretKey, service: "faceid", host, action, version, timestamp, nonce, payload,
  });

  const res = await fetch(`https://${host}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Host: host,
      "X-TC-Action": action,
      "X-TC-Version": version,
      "X-TC-Timestamp": timestamp,
      "X-TC-Region": process.env.KYC_TENCENT_REGION ?? "ap-guangzhou",
      "X-TC-Signature": signature,
      "X-TC-Key": secretId,
      "X-TC-Nonce": nonce,
    },
    body: payload,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tencent face verify error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const score = data.Response?.Similarity ?? 0;
  const resultCode = data.Response?.Result ?? "-1";
  const result: "PASS" | "FAIL" | "REVIEW" =
    resultCode === "0" ? "PASS" : resultCode === "-2" ? "REVIEW" : "FAIL";

  return { score, result, provider: "tencent", confidenceInterval: confidenceBounds(score), method: "Tencent Cloud CompareFace v2018-03-01" };
}

// ── Stub ────────────────────────────────────────────────────
function confidenceBounds(score: number): [number, number] {
  const lower = Math.max(0, Math.round(score - 10));
  const upper = Math.min(100, Math.round(score + 5));
  return [lower, upper];
}

function stubCompare(): FaceCompareResult {
  const score = Math.round(80 + Math.random() * 19);
  const result: "PASS" | "FAIL" | "REVIEW" = score >= 80 ? "PASS" : "FAIL";
  return { score, result, provider: "stub", confidenceInterval: [score - 10, Math.min(100, score + 5)], method: "PortraitPay Demo Stub" };
}

// ── Crypto helpers ──────────────────────────────────────────
async function signAliyunRequest(opts: {
  method: string; host: string; path: string;
  headers: Record<string, string>; body: string;
  accessKeyId: string; accessKeySecret: string;
}): Promise<string> {
  const bodyHash = await sha256Base64(opts.body);
  const signString = `${opts.method}\n${opts.host}\n${opts.path}\n${bodyHash}`;
  const key = opts.accessKeySecret + "&";
  const signature = await hmacSha1Base64(key, signString);
  return `acs ${opts.accessKeyId}:${signature}`;
}

async function tencentSign(opts: {
  secretKey: string; service: string; host: string;
  action: string; version: string; timestamp: string;
  nonce: string; payload: string;
}): Promise<string> {
  const { secretKey, service, host, timestamp, payload } = opts;
  const date = new Date(parseInt(timestamp) * 1000).toISOString().split("T")[0];
  const canonicalHeaders = `content-type:application/json\nhost:${host}\n`;
  const signedHeaders = "content-type;host";
  const hashedPayload = await sha256Base64(payload);
  const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${hashedPayload}`;
  const credentialScope = `${date}/${service}/tc3_request`;
  const hashedCanonicalRequest = await sha256Base64(canonicalRequest);
  const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`;
  const kDate = await hmacSha256(secretKey, date);
  const kService = await hmacSha256(kDate, service);
  const kSigning = await hmacSha256(kService, "tc3_request");
  const sig = await hmacSha256(kSigning, stringToSign);
  return btoa(String.fromCharCode(...Array.from(new Uint8Array(sig))));
}

async function sha256Base64(data: string): Promise<string> {
  const buf = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return btoa(String.fromCharCode(...Array.from(new Uint8Array(hash))));
}

async function hmacSha1Base64(key: string, data: string): Promise<string> {
  const keyBuf = new TextEncoder().encode(key);
  const dataBuf = new TextEncoder().encode(data);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyBuf, { name: "HMAC", hash: "SHA-1" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, dataBuf);
  return btoa(String.fromCharCode(...Array.from(new Uint8Array(sig))));
}

async function hmacSha256(key: string | Uint8Array, data: string): Promise<Uint8Array> {
  const keyBuf = typeof key === "string" ? new TextEncoder().encode(key) : key;
  const dataBuf = new TextEncoder().encode(data);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyBuf as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, dataBuf as BufferSource));
}
