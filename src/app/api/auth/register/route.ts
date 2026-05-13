
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { RegisterSchema } from "@/lib/auth/schemas";
import { signTokenPair } from "@/lib/auth/edge-jwt";
import { setTokenCookies } from "@/lib/auth/session";
import { sendWelcomeEmail, sendVerificationEmail } from "@/lib/email";
export const dynamic = "force-dynamic";

type UserRole = string;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password, name, role, phone, allowLicensing, allowedScopes, prohibitedContent, mediaKitUrl, mediaKitShareConfirmed, mediaKitReviewOnlyAcknowledged, mediaKitVisibility } = parsed.data;

    // Check if user exists (excluding soft-deleted users)
    const existing = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "This email is already registered" },
        { status: 409 }
      );
    }

    // If a soft-deleted user exists with this email, hard-delete them to allow re-registration
    const deletedUser = await prisma.user.findFirst({
      where: { email, deletedAt: { not: null } },
    });

    if (deletedUser) {
      await prisma.user.delete({ where: { id: deletedUser.id } });
    }

    // If phone provided, check uniqueness (excluding soft-deleted users)
    if (phone) {
      const phoneExists = await prisma.user.findFirst({
        where: { phone, deletedAt: null },
      });
      if (phoneExists) {
        return NextResponse.json(
          { success: false, message: "This phone number is already in use" },
          { status: 409 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        phone: phone || null,
        name,
        passwordHash: hashedPassword,
        role: role as UserRole,
        walletAddress: null,
        mediaKitUrl: (mediaKitUrl && mediaKitUrl.trim() !== "") ? mediaKitUrl.trim() : null,
        mediaKitShareConfirmed: mediaKitShareConfirmed ?? false,
        mediaKitReviewOnlyAcknowledged: mediaKitReviewOnlyAcknowledged ?? false,
        mediaKitVisibility: mediaKitVisibility ?? "PRIVATE",
        portraitSettings: {
          create: {
            allowLicensing: allowLicensing ?? true,
            allowedScopes: allowedScopes ?? [],
            prohibitedContent: prohibitedContent ?? [],
          },
        },
      },
      select: { id: true, email: true, name: true, role: true },
    });

    // Send welcome email (non-blocking — don't fail registration if email throws)
    sendWelcomeEmail({ email: user.email, name: user.name ?? user.email.split("@")[0], role: user.role }).catch((emailError) => {
      console.error("[REGISTER] Welcome email failed:", emailError instanceof Error ? emailError.message : String(emailError));
    });

    // Send verification email (blocking — must be observable, returns emailSent status)
    let emailSent = true;
    let verificationError: string | undefined;
    try {
      const result = await sendVerificationEmail({
        userId: user.id,
        email: user.email,
        name: user.name ?? user.email.split("@")[0],
        prisma,
      });
      emailSent = result.sent;
      verificationError = result.error;
    } catch (err) {
      emailSent = false;
      verificationError = err instanceof Error ? err.message : String(err);
      console.error("[REGISTER] Verification email threw:", verificationError);
    }

    const tokens = await signTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const responseBody: Record<string, unknown> = {
      success: true,
      message: emailSent ? "Registration successful" : "Registration successful, but verification email failed",
      emailSent,
      ...(!emailSent && { emailError: verificationError }),
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };

    const response = NextResponse.json(responseBody, { status: 201 });

    response.cookies.set(
      setTokenCookies(tokens.accessToken, tokens.refreshToken).accessTokenCookie,
      tokens.accessToken,
      { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 15, secure: process.env.NODE_ENV === "production" }
    );
    response.cookies.set(
      setTokenCookies(tokens.accessToken, tokens.refreshToken).refreshTokenCookie,
      tokens.refreshToken,
      { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7, secure: process.env.NODE_ENV === "production" }
    );

    return response;
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    const message = error instanceof Error ? error.message : String(error);
    console.error("[REGISTER_ERROR] Details:", message);
    return NextResponse.json(
      { success: false, message: "Server error, please try again later", debug: message },
      { status: 500 }
    );
  }
}
