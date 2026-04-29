/**
 * POST /api/lawyers/apply
 * 律师楼入驻申请
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/request-context";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
export const dynamic = "force-dynamic";

const LawyerApplySchema = z.object({
  lawyerType: z.enum(["firm", "personal"]).default("firm"),
  companyName: z.string().min(1, "公司名称不能为空").max(200),
  country: z.string().min(1, "请选择地区").max(100),
  contactName: z.string().min(1, "联系人不能为空").max(100),
  contactEmail: z.string().email("请输入有效的邮箱地址"),
  contactPhone: z.string().min(1, "联系电话不能为空").max(30),
  licenseUrl: z.string().url("请输入有效的资质证明链接").optional().or(z.literal("")),
}).transform((data) => ({
  lawyerType: data.lawyerType,
  companyName: data.companyName,
  region: data.country,
  contactName: data.contactName,
  contactEmail: data.contactEmail,
  contactPhone: data.contactPhone,
  licenseUrl: data.licenseUrl,
}));

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = LawyerApplySchema.parse(body);

    // Check for duplicate pending applications
    const existing = await prisma.lawyerRegistration.findFirst({
      where: {
        contactEmail: data.contactEmail,
        status: { in: ["PENDING", "REVIEWING"] },
      },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "该邮箱已有待审核的申请，请等待审核结果" },
        { status: 409 }
      );
    }

    const registration = await prisma.lawyerRegistration.create({
      data: {
        lawyerType: data.lawyerType,
        companyName: data.companyName,
        region: data.region,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        licenseUrl: data.licenseUrl || null,
        status: "PENDING",
      },
    });

    // Send confirmation email to the applicant
    try {
      const submittedAt = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
      const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:#244169;padding:20px 24px">
    <h2 style="margin:0;color:#fff;font-size:18px">⚖️ 律师入驻申请已收到</h2>
    <p style="margin:4px 0 0;color:#93c5fd;font-size:13px">PortraitPay AI · 入驻申请</p>
  </div>
  <div style="padding:24px">
    <p style="font-size:15px;color:#333">${data.contactName}，您好！</p>
    <p style="font-size:15px;color:#333">我们已收到您的律师入驻申请，以下是申请详情：</p>
    <div style="margin:20px 0;padding:16px;background:#f9f9f9;border-radius:8px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#666;font-size:13px">申请类型</td><td style="padding:6px 0;font-size:13px;font-weight:bold;color:#333">${data.lawyerType === "firm" ? "律所" : "个人律师"}</td></tr>
        <tr><td style="padding:6px 0;color:#666;font-size:13px">公司/律所名称</td><td style="padding:6px 0;font-size:13px;color:#333">${data.companyName}</td></tr>
        <tr><td style="padding:6px 0;color:#666;font-size:13px">联系人</td><td style="padding:6px 0;font-size:13px;color:#333">${data.contactName}</td></tr>
        <tr><td style="padding:6px 0;color:#666;font-size:13px">联系邮箱</td><td style="padding:6px 0;font-size:13px;color:#333">${data.contactEmail}</td></tr>
        <tr><td style="padding:6px 0;color:#666;font-size:13px">联系电话</td><td style="padding:6px 0;font-size:13px;color:#333">${data.contactPhone}</td></tr>
        <tr><td style="padding:6px 0;color:#666;font-size:13px">提交时间</td><td style="padding:6px 0;font-size:13px;color:#333">${submittedAt}</td></tr>
      </table>
    </div>
    <div style="margin:16px 0;padding:14px;background:#eff6ff;border-radius:8px;border-left:4px solid #244169">
      <p style="margin:0;font-size:13px;color:#1e40af;font-weight:bold">📋 审核说明</p>
      <p style="margin:6px 0 0;font-size:13px;color:#1e40af">我们的团队将在 <strong>3-5 个工作日</strong>内完成资料审核。</p>
      <p style="margin:6px 0 0;font-size:13px;color:#1e40af">审核结果将发送至您上述邮箱，请留意查收。</p>
    </div>
    <p style="font-size:12px;color:#999;margin-top:16px">此通知由系统自动发送，请勿回复。如有疑问请联系 support@portraitpayai.com</p>
  </div>
</div>
</body>
</html>`;

      const text = `PortraitPay AI — 律师入驻申请已收到\n\n${data.contactName}，您好！\n我们已收到您的律师入驻申请。\n\n申请详情：\n申请类型：${data.lawyerType === "firm" ? "律所" : "个人律师"}\n公司/律所名称：${data.companyName}\n联系人：${data.contactName}\n联系邮箱：${data.contactEmail}\n联系电话：${data.contactPhone}\n提交时间：${submittedAt}\n\n审核说明：\n我们的团队将在 3-5 个工作日内完成资料审核。审核结果将发送至您的邮箱，请留意查收。\n\n此通知由系统自动发送，请勿回复。`;

      await sendEmail({
        to: data.contactEmail,
        subject: "PortraitPay AI - 律师入驻申请已收到 | Lawyer Registration Received",
        html,
        text,
      });
      console.log("[/api/lawyers/apply] Confirmation email sent to:", data.contactEmail);
    } catch (emailErr) {
      // Non-blocking — log but don't fail the registration
      console.error("[/api/lawyers/apply] Failed to send confirmation email:", emailErr instanceof Error ? emailErr.message : String(emailErr));
    }

    return NextResponse.json({
      success: true,
      data: {
        id: registration.id,
        message: "申请已提交，我们会在 3-5 个工作日内完成审核",
      },
    }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const firstError = err.issues?.[0]?.message ?? "数据格式不正确";
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }
    console.error("[/api/lawyers/apply POST]", err);
    return NextResponse.json({ success: false, error: "服务器内部错误" }, { status: 500 });
  }
}

// GET /api/lawyers/apply — check application status (by email or session)
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email && !session?.userId) {
      return NextResponse.json({ success: false, error: "请提供邮箱地址或登录后查询" }, { status: 400 });
    }

    const queryEmail = email || session?.email;
    const registration = await prisma.lawyerRegistration.findFirst({
      where: { contactEmail: queryEmail },
      orderBy: { createdAt: "desc" },
    });

    if (!registration) {
      return NextResponse.json({ success: false, error: "未找到申请记录" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: registration });
  } catch (err) {
    return NextResponse.json({ success: false, error: "查询失败" }, { status: 500 });
  }
}