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
  companyName: z.string().min(1, "Company name is required").max(200),
  country: z.string().min(1, "Please select a region").max(100),
  contactName: z.string().min(1, "Contact name is required").max(100),
  contactEmail: z.string().email("Invalid email format"),
  contactPhone: z.string().min(1, "Phone number is required").max(30),
  licenseUrl: z.string().url("Invalid license URL format").optional().or(z.literal("")),
  barNumber: z.string().optional(),
  barState: z.string().optional(),
  federalAdmission: z.boolean().optional(),
}).transform((data) => ({
  lawyerType: data.lawyerType,
  companyName: data.companyName,
  region: data.country,
  contactName: data.contactName,
  contactEmail: data.contactEmail,
  contactPhone: data.contactPhone,
  licenseUrl: data.licenseUrl,
  barNumber: data.barNumber,
  barState: data.barState,
  federalAdmission: data.federalAdmission,
}));

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = LawyerApplySchema.parse(body);

    const session = await getSessionFromRequest(req);
    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to apply as lawyer" },
        { status: 401 }
      );
    }

    // Check for duplicate pending applications
    const existing = await prisma.lawyerRegistration.findFirst({
      where: {
        contactEmail: data.contactEmail,
        status: { in: ["PENDING", "REVIEWING"] },
      },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An application is already pending for this email" },
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
        barNumber: data.barNumber || null,
        barState: data.barState || null,
        federalAdmission: data.federalAdmission || false,
        status: "APPROVED",
        reviewedAt: new Date(),
        userId: session.userId,
      },
    });

    // Auto-approve: promote user to LAWYER role immediately
    await prisma.user.update({
      where: { id: session.userId },
      data: { role: "LAWYER" },
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
    <h2 style="margin:0;color:#fff;font-size:18px">⚖️ 律师入驻申请已通过</h2>
    <p style="margin:4px 0 0;color:#93c5fd;font-size:13px">PortraitPay AI · 入驻成功</p>
  </div>
  <div style="padding:24px">
    <p style="font-size:15px;color:#333">${data.contactName}，您好！</p>
    <p style="font-size:15px;color:#333">恭喜！您的律师入驻申请已通过审核。</p>
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
    <div style="margin:16px 0;padding:14px;background:#f0fdf4;border-radius:8px;border-left:4px solid #16a34a">
      <p style="margin:0;font-size:13px;color:#166534;font-weight:bold">✅ 审核结果</p>
      <p style="margin:6px 0 0;font-size:13px;color:#166534">您的律师入驻申请已自动通过审核。</p>
      <p style="margin:6px 0 0;font-size:13px;color:#166534">您现在可以登录平台开始使用律师功能。</p>
    </div>
    <p style="font-size:12px;color:#999;margin-top:16px">此通知由系统自动发送，请勿回复。如有疑问请联系 contact@portraitpayai.com</p>
  </div>
</div>
</body>
</html>`;

      const text = `PortraitPay AI — 律师入驻申请已通过\n\n${data.contactName}，您好！\n恭喜！您的律师入驻申请已通过审核。\n\n入驻详情：\n申请类型：${data.lawyerType === "firm" ? "律所" : "个人律师"}\n公司/律所名称：${data.companyName}\n联系人：${data.contactName}\n联系邮箱：${data.contactEmail}\n联系电话：${data.contactPhone}\n提交时间：${submittedAt}\n\n审核结果：\n您的律师入驻申请已自动通过审核。您现在可以登录平台开始使用律师功能。\n\n此通知由系统自动发送，请勿回复。`;

      await sendEmail({
        to: data.contactEmail,
        subject: "PortraitPay AI - 律师入驻申请已通过 | Lawyer Registration Approved",
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
        message: "申请已通过审核，您已成为认证律师",
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