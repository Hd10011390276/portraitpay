/**
 * POST /api/lawyers/apply
 * 律师楼入驻申请
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/request-context";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

const LawyerApplySchema = z.object({
  lawyerType: z.enum(["firm", "personal"]).default("firm"),
  companyName: z.string().min(1, "公司名称不能为空").max(200),
  region: z.string().min(1, "请选择地区").max(100),
  contactName: z.string().min(1, "联系人不能为空").max(100),
  contactEmail: z.string().email("请输入有效的邮箱地址"),
  contactPhone: z.string().min(1, "联系电话不能为空").max(30),
  licenseUrl: z.string().url("请输入有效的资质证明链接").optional().or(z.literal("")),
});

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