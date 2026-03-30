/**
 * POST /api/contacts — 提交联系表单
 * Body: { type, name, email, company, subject, message, enterpriseName?, intendedUse?, expectedScale?, contactPhone? }
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendContactNotification, ContactEmailData } from "@/lib/email";

const GeneralContactSchema = z.object({
  type: z.literal("GENERAL"),
  name: z.string().min(1, "姓名不能为空").max(100),
  email: z.string().email("邮箱格式不正确"),
  company: z.string().max(200).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().min(10, "留言至少10个字符").max(5000),
});

const EnterpriseContactSchema = z.object({
  type: z.literal("ENTERPRISE"),
  name: z.string().min(1, "姓名不能为空").max(100),
  email: z.string().email("邮箱格式不正确"),
  company: z.string().max(200).optional(),
  enterpriseName: z.string().min(1, "企业名称不能为空").max(200),
  intendedUse: z.string().min(10, "用途说明至少10个字符").max(2000),
  expectedScale: z.string().max(100).optional(),
  contactPhone: z.string().max(30).optional(),
  message: z.string().max(5000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let dbData: Parameters<typeof prisma.contactSubmission.create>[0]["data"];

    if (body.type === "ENTERPRISE") {
      const data = EnterpriseContactSchema.parse(body);
      dbData = {
        type: "ENTERPRISE",
        name: data.name,
        email: data.email,
        company: data.company,
        message: data.message ?? "",
        enterpriseName: data.enterpriseName,
        intendedUse: data.intendedUse,
        expectedScale: data.expectedScale,
        contactPhone: data.contactPhone,
        status: "NEW",
      };
    } else {
      const data = GeneralContactSchema.parse({ ...body, type: "GENERAL" });
      dbData = {
        type: "GENERAL",
        name: data.name,
        email: data.email,
        company: data.company,
        subject: data.subject,
        message: data.message,
        status: "NEW",
      };
    }

    // Save to database
    const submission = await prisma.contactSubmission.create({ data: dbData });

    // Send email notification (non-blocking — errors don't fail the request)
    try {
      const emailData: ContactEmailData = {
        type: dbData.type as "GENERAL" | "ENTERPRISE",
        name: dbData.name,
        email: dbData.email,
        company: dbData.company ?? undefined,
        message: dbData.message,
        ...(dbData.type === "ENTERPRISE" ? {
          enterpriseName: dbData.enterpriseName ?? undefined,
          intendedUse: dbData.intendedUse ?? undefined,
          expectedScale: dbData.expectedScale ?? undefined,
          contactPhone: dbData.contactPhone ?? undefined,
        } : {}),
      };
      await sendContactNotification(emailData);
      await prisma.contactSubmission.update({
        where: { id: submission.id },
        data: { emailSent: true, emailSentAt: new Date() },
      });
    } catch (emailErr) {
      console.error("[Contact] Email send failed:", emailErr);
      await prisma.contactSubmission.update({
        where: { id: submission.id },
        data: { emailError: String(emailErr) },
      });
    }

    return NextResponse.json({
      success: true,
      message: "提交成功，我们会尽快与您联系",
      data: { id: submission.id },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const firstError = err.issues?.[0]?.message ?? "数据格式不正确";
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }
    console.error("[Contact] POST error:", err);
    return NextResponse.json(
      { success: false, error: "服务器内部错误，请稍后重试" },
      { status: 500 }
    );
  }
}

