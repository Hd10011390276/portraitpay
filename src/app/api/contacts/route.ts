
/**
 * POST /api/contacts — 提交联系表单
 * Body: { type, name, email, company, subject, message, enterpriseName?, intendedUse?, expectedScale?, contactPhone? }
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendContactNotification, ContactEmailData } from "@/lib/email";
export const dynamic = "force-dynamic";


const GeneralContactSchema = z.object({
  type: z.literal("GENERAL"),
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format"),
  company: z.string().max(200).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000),
});

const EnterpriseContactSchema = z.object({
  type: z.literal("ENTERPRISE"),
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format"),
  company: z.string().max(200).optional(),
  enterpriseName: z.string().min(1, "Company name is required").max(200),
  intendedUse: z.string().min(10, "Please describe intended use (min 10 characters)").max(2000),
  expectedScale: z.string().max(100).optional(),
  contactPhone: z.string().max(30).optional(),
  message: z.string().max(5000).optional(),
});

const CelebrityContactSchema = z.object({
  type: z.literal("CELEBRITY"),
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format"),
  contactPhone: z.string().max(30).optional(),
  subject: z.string().min(1, "Stage name is required").max(200),
  enterpriseName: z.string().min(1, "Please select a category").max(50),
  intendedUse: z.string().max(1000).optional(),
  company: z.string().max(200).optional(),
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
    } else if (body.type === "CELEBRITY") {
      const data = CelebrityContactSchema.parse(body);
      dbData = {
        type: "CELEBRITY",
        name: data.name,
        email: data.email,
        contactPhone: data.contactPhone,
        subject: data.subject, // stage name
        enterpriseName: data.enterpriseName, // category
        intendedUse: data.intendedUse, // social media
        company: data.company, // agency
        message: data.message ?? "",
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
        type: dbData.type as "GENERAL" | "ENTERPRISE" | "CELEBRITY",
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
        ...(dbData.type === "CELEBRITY" ? {
          enterpriseName: dbData.enterpriseName ?? undefined, // category
          intendedUse: dbData.intendedUse ?? undefined,      // social media
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
      message: "Your message has been received. We will contact you shortly.",
      data: { id: submission.id },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const firstError = err.issues?.[0]?.message ?? "Invalid data format";
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }
    console.error("[Contact] POST error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}

