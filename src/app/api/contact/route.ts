
/**
 * POST /api/contact — Simple contact form submission
 * Body: { name, email, subject, message }
 *
 * Environment variables required:
 * - SMTP_HOST: SMTP server host (e.g., smtp.exmail.qq.com)
 * - SMTP_PORT: SMTP server port (e.g., 465 for SSL, 587 for TLS)
 * - SMTP_USER: SMTP username/email
 * - SMTP_PASS: SMTP password
 * - CONTACT_TO_EMAIL: Recipient email address (defaults to ADMIN_EMAIL or contact@portraitpayai.com)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
export const dynamic = "force-dynamic";


// Zod schema for contact form validation
const ContactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject is too long"),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000, "Message is too long"),
});

// Type for validated contact form data
type ContactFormData = z.infer<typeof ContactFormSchema>;

// Simple nodemailer wrapper using native fetch with SMTP
// For production, install nodemailer: npm install nodemailer && npm install -D @types/nodemailer
async function sendSmtpEmail(options: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  // Use nodemailer if available, otherwise throw a helpful error
  let nodemailer: typeof import("nodemailer") | null = null;
  try {
    nodemailer = await import("nodemailer");
  } catch {
    throw new Error(
      "nodemailer is not installed. Please run: npm install nodemailer && npm install -D @types/nodemailer"
    );
  }

  const transporter = nodemailer.createTransport({
    host: options.host,
    port: options.port,
    secure: options.secure,
    auth: {
      user: options.user,
      pass: options.pass,
    },
  });

  await transporter.sendMail({
    from: options.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

function buildContactEmailHtml(data: ContactFormData): string {
  const timestamp = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#7c3aed;padding:20px 24px">
      <h2 style="margin:0;color:#fff;font-size:18px">Contact Form Submission</h2>
      <p style="margin:4px 0 0;color:#e9d5ff;font-size:13px">PortraitPay AI · New Message</p>
    </div>
    <div style="padding:24px">
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <tbody>
          <tr><td style="padding:8px 12px;font-weight:bold;color:#666;white-space:nowrap">Name</td><td style="padding:8px 12px">${escapeHtml(data.name)}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:bold;color:#666;white-space:nowrap">Email</td><td style="padding:8px 12px"><a href="mailto:${escapeHtml(data.email)}" style="color:#7c3aed">${escapeHtml(data.email)}</a></td></tr>
          <tr><td style="padding:8px 12px;font-weight:bold;color:#666;white-space:nowrap">Subject</td><td style="padding:8px 12px">${escapeHtml(data.subject)}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:bold;color:#666;white-space:nowrap;vertical-align:top">Message</td><td style="padding:8px 12px;white-space:pre-wrap">${escapeHtml(data.message)}</td></tr>
        </tbody>
      </table>
      <p style="font-size:12px;color:#999">Submitted: ${timestamp}</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] ?? char);
}

export async function POST(req: NextRequest) {
  try {
    // Parse request body with fallback for empty/invalid body
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Check for required fields before Zod validation
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Request body is required" },
        { status: 400 }
      );
    }

    // Ensure string fields that might be undefined become empty strings
    const sanitizedBody = {
      name: String(body.name ?? ""),
      email: String(body.email ?? ""),
      subject: String(body.subject ?? ""),
      message: String(body.message ?? ""),
    };

    // Validate input with Zod
    const validatedData = ContactFormSchema.parse(sanitizedBody);

    // Get SMTP configuration from environment variables
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT ?? "587", 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error("[Contact] SMTP environment variables not configured:", {
        hasHost: !!smtpHost,
        hasUser: !!smtpUser,
        hasPass: !!smtpPass,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Email service is not configured. Please contact support.",
        },
        { status: 500 }
      );
    }

    // Determine if using SSL (port 465) or TLS (other ports)
    const secure = smtpPort === 465;

    // Get recipient email
    const toEmail =
      process.env.CONTACT_TO_EMAIL ??
      process.env.ADMIN_EMAIL ??
      "contact@portraitpayai.com";

    // Get sender email (must be authenticated SMTP user)
    const fromEmail = smtpUser;

    // Build email content
    const subject = `[PortraitPay AI] ${validatedData.subject}`;
    const html = buildContactEmailHtml(validatedData);
    const text = [
      `Contact Form Submission - PortraitPay AI`,
      `==========================================`,
      `Name: ${validatedData.name}`,
      `Email: ${validatedData.email}`,
      `Subject: ${validatedData.subject}`,
      ``,
      `Message:`,
      validatedData.message,
      ``,
      `-------------------------------------------`,
      `Submitted: ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`,
    ].join("\n");

    // Send email via SMTP
    try {
      await sendSmtpEmail({
        host: smtpHost,
        port: smtpPort,
        secure,
        user: smtpUser,
        pass: smtpPass,
        to: toEmail,
        from: fromEmail,
        subject,
        html,
        text,
      });
    } catch (emailError) {
      console.error("[Contact] Failed to send email:", emailError);
      return NextResponse.json(
        {
          success: false,
          error:
            emailError instanceof Error && emailError.message.includes("nodemailer is not installed")
              ? "Email service dependency missing. Please contact support."
              : "Failed to send email. Please try again later.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Your message has been sent successfully. We will get back to you soon.",
      },
      { status: 200 }
    );
  } catch (err) {
    // Handle Zod validation errors
    if (err instanceof z.ZodError) {
      const firstError = err.issues?.[0]?.message ?? "Invalid input";
      return NextResponse.json(
        {
          success: false,
          error: firstError,
        },
        { status: 400 }
      );
    }

    // Log unexpected errors
    console.error("[Contact] Unexpected error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again later.",
      },
      { status: 500 }
    );
  }
}

// Optional: Handle OPTIONS for CORS preflight if needed
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
