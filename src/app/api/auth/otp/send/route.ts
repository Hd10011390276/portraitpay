import { NextRequest, NextResponse } from "next/server";
import { SendOtpSchema } from "@/lib/auth/schemas";
import { createOtp } from "@/lib/auth/otp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "表单验证失败",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { phone } = parsed.data;

    // In production: check rate limit, send SMS via Twilio/Alibaba Cloud.
    // For now, generate and return code (test mode).
    const { code, expiresAt } = createOtp(phone);

    // Log to server console for test mode
    console.log(`[OTP] 📱 ${phone} → code: ${code} (expires: ${expiresAt.toISOString()})`);

    return NextResponse.json(
      {
        success: true,
        message: "验证码已发送",
        // In production, DO NOT return the code to the client
        data: process.env.NODE_ENV === "development" ? { code, expiresAt } : { expiresAt },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[OTP_SEND_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
