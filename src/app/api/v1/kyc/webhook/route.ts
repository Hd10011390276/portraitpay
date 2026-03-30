/**
 * POST /api/v1/kyc/webhook
 * 第三方 KYC 服务回调
 *
 * 支持：阿里云、腾讯云、Onfido、Jumio
 * 建议：使用 HMAC 签名验签
 */
import { NextRequest, NextResponse } from "next/server";
import { kycService } from "@/lib/kyc/service";

/** 从请求头推断提供商 */
function detectProvider(req: NextRequest): string {
  const host = req.headers.get("origin") ?? req.headers.get("host") ?? "";
  if (host.includes("aliyun") || host.includes("faceverification")) return "aliyun";
  if (host.includes("tencent") || host.includes("cloud.tencent")) return "tencent";
  if (host.includes("onfido")) return "onfido";
  if (host.includes("jumio")) return "jumio";
  return req.nextUrl.searchParams.get("provider") ?? "aliyun";
}

/** 验签中间件（示例） */
async function verifySignature(
  provider: string,
  payload: string,
  signature: string | null
): Promise<boolean> {
  if (!signature) return process.env.NODE_ENV === "development";

  const secret = {
    aliyun: process.env.KYC_ALIYUN_WEBHOOK_SECRET,
    tencent: process.env.KYC_TENCENT_WEBHOOK_SECRET,
    onfido: process.env.KYC_ONFIDO_WEBHOOK_SECRET,
    jumio: process.env.KYC_JUMIO_WEBHOOK_SECRET,
  }[provider];

  if (!secret) return process.env.NODE_ENV === "development";

  // HMAC-SHA256 验签
  const { createHmac } = await import("crypto");
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return expected === signature;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);
    const provider = detectProvider(req);
    const signature = req.headers.get("x-signature") ??
                      req.headers.get("x-webhook-signature");

    // 验签
    const valid = await verifySignature(provider, rawBody, signature);
    if (!valid) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
    }

    await kycService.handleWebhook(provider, payload);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[KYC Webhook] Error:", err);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
