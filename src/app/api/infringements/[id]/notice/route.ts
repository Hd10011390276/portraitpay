/**
 * POST   /api/infringements/[id]/notice  — Generate & send a takedown notice
 *
 * Body: {
 *   type: "TAKEDOWN" | "WARNING" | "LEGAL",
 *   recipientName: string,
 *   recipientEmail?: string,
 *   recipientPhone?: string,
 *   platformEmail?: string,
 *   platformAddress?: string,
 *   channel?: "EMAIL" | "POST" | "API",
 *   submitForNotarization?: boolean  // auto-submit to 公证处
 * }
 *
 * GET    /api/infringements/[id]/notice  — List all notices for this report
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { renderNotice, renderNoticeHtml, NoticeType } from "@/lib/infringement/notice";
import { submitForNotarization as notarizeEvidence } from "@/lib/infringement/notarization";
import { uploadJsonToIpfs } from "@/lib/ipfs";

// ─────────────────────────────────────────────────────────────────────────────

const CreateNoticeSchema = z.object({
  type: z.enum(["TAKEDOWN", "WARNING", "LEGAL"]),
  recipientName: z.string().min(1),
  recipientEmail: z.string().email().optional(),
  recipientPhone: z.string().optional(),
  platformEmail: z.string().email().optional(),
  platformAddress: z.string().optional(),
  channel: z.enum(["EMAIL", "POST", "API"]).default("EMAIL"),
  submitForNotarization: z.boolean().default(false),
});

// ─────────────────────────────────────────────────────────────────────────────

type RouteContext = { params: Promise<{ id: string }> };

// GET — List notices
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const notices = await prisma.infringementNotice.findMany({
      where: { reportId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: notices });
  } catch (error) {
    console.error("[GET /api/infringements/[id]/notice]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST — Generate & send notice
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const report = await prisma.infringementReport.findUnique({
      where: { id },
      include: {
        reporter: { select: { displayName: true, email: true } },
        portrait: { select: { id: true, title: true, ownerId: true, owner: { select: { displayName: true, email: true } } } },
      },
    });

    if (!report) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    const isOwner = report.portrait.ownerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = CreateNoticeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      type,
      recipientName,
      recipientEmail,
      recipientPhone,
      platformEmail,
      platformAddress,
      channel,
      submitForNotarization,
    } = parsed.data;

    const portraitOwner = report.portrait.owner;
    const detectedUrl = report.detectedUrl ?? "";

    // ── Render notice ─────────────────────────────────────────────────────────
    const noticeData = {
      portraitTitle: report.portrait.title,
      portraitOwnerName: portraitOwner.displayName ?? report.portrait.title,
      infringingUrl: detectedUrl,
      detectedAt: report.detectedAt ?? new Date(),
      evidenceHash: report.evidenceHash ?? "",
      ownerContactEmail: portraitOwner.email ?? "",
      platformName: recipientName,
      platformEmail,
      platformAddress,
      screenshotUrl: undefined,
      reportId: report.id,
      issuedAt: new Date(),
    };

    const rendered = renderNotice(type as NoticeType, noticeData);
    const htmlBody = renderNoticeHtml(rendered, noticeData);

    // ── Notarization (if requested) ──────────────────────────────────────────
    let notarizationId: string | undefined;
    let notarizationCertNo: string | undefined;
    let noticeIpfsCid: string | undefined;

    if (submitForNotarization) {
      try {
        const notaryResult = await notarizeEvidence({
          internalId: report.id,
          evidenceType: "infringement_report",
          evidenceHash: report.evidenceHash ?? report.id,
          capturedAt: report.detectedAt ?? new Date(),
          description: `${type} notice for portrait: ${report.portrait.title}`,
          reporterName: portraitOwner.displayName ?? undefined,
        });
        notarizationId = notaryResult.notarizationId;
        notarizationCertNo = notaryResult.certificateNo;
      } catch (err) {
        console.error("[Notice] Notarization submission failed:", err);
        // Continue without notarization — don't block notice creation
      }
    }

    // ── IPFS backup ───────────────────────────────────────────────────────────
    try {
      const ipfsResult = await uploadJsonToIpfs(
        { ...noticeData, rendered } as Record<string, unknown>,
        `notice-${report.id}-${Date.now()}.json`
      );
      noticeIpfsCid = ipfsResult.cid;
    } catch (err) {
      console.error("[Notice] IPFS backup failed:", err);
    }

    // ── Save notice to DB ──────────────────────────────────────────────────────
    const notice = await prisma.infringementNotice.create({
      data: {
        reportId: id,
        type: type as "TAKEDOWN" | "WARNING" | "LEGAL",
        recipientName,
        recipientEmail,
        recipientPhone,
        recipientAddress: platformAddress,
        subject: rendered.subject,
        body: rendered.body,
        renderedHtml: htmlBody,
        channel,
        status: "DRAFT",
        notarizationId,
        notarizationCert: notarizationCertNo,
        noticeIpfsCid,
      },
    });

    // ── Send via channel ───────────────────────────────────────────────────────
    if (channel === "EMAIL" && (recipientEmail || platformEmail)) {
      // STUB — real implementation sends via Resend:
      // await resend.emails.send({
      //   from: "PortraitPay <legal@portraitpayai.com>",
      //   to: recipientEmail ?? platformEmail ?? "",
      //   subject: rendered.subject,
      //   html: htmlBody,
      // });
      await prisma.infringementNotice.update({
        where: { id: notice.id },
        data: { status: "SENT", sentAt: new Date() },
      });
      console.log(`[Notice] STUB — sent ${type} notice to ${recipientEmail ?? platformEmail} for report ${id}`);
    } else {
      // POST / API channel — mark as ready
      await prisma.infringementNotice.update({
        where: { id: notice.id },
        data: { status: "DRAFT" },
      });
    }

    const updatedNotice = await prisma.infringementNotice.findUnique({ where: { id: notice.id } });
    return NextResponse.json({ success: true, data: updatedNotice }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/infringements/[id]/notice]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
