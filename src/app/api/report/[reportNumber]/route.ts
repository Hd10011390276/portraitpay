/**
 * /report/[reportNumber] — Public view of an infringement report
 * No authentication required.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { reportNumber: string } }
) {
  const { reportNumber } = params;

  const record = await prisma.infringementReportQuick.findUnique({
    where: { reportNumber },
  });

  if (!record) {
    return NextResponse.json(
      { success: false, message: "Report not found" },
      { status: 404 }
    );
  }

  const typeLabel: Record<string, string> = {
    AI_FACE_CLONE: "AI Face Clone / Digital Human",
    VOICE_CLONE: "Voice Clone",
    AI_SHORT_DRAMA: "AI Short Drama Infringement",
    OTHER: "Other",
    UNAUTHORIZED_USE: "Unauthorized Use",
    EXPIRED_LICENSE: "Expired License",
    SCOPE_VIOLATION: "Scope Violation",
    RESALE: "Resale/Illegal Transfer",
    DEEPFAKE: "Synthetic Media",
  };
  const platformLabel: Record<string, string> = {
    youtube: "YouTube", douyin: "Douyin", kuaishou: "Kuaishou",
    xiaohongshu: "Xiaohongshu", bilibili: "Bilibili", weibo: "Weibo",
    toutiao: "Toutiao", weixin: "WeChat Video", instagram: "Instagram",
    tiktok: "TikTok", other: "Other",
  };

  return NextResponse.json({
    success: true,
    data: {
      reportNumber: record.reportNumber,
      status: record.status,
      reportedName: record.reportedName,
      reportedEmail: record.reportedEmail,
      phone: record.phone,
      infringementType: record.infringementType,
      infringementTypeLabel: typeLabel[record.infringementType] ?? record.infringementType,
      platformName: record.platformName,
      platformNameLabel: record.platformName ? (platformLabel[record.platformName] ?? record.platformName) : null,
      platformUrl: record.platformUrl,
      description: record.description,
      evidenceUrls: record.evidenceUrls,
      generatedAt: record.generatedAt,
    },
  });
}