/**
 * GET /api/actors — List actors for discovery
 * Returns TALENT users with media kit info filtered by visibility rules
 *
 * Visibility rules:
 * - PUBLIC       → any logged-in user can see mediaKitUrl
 * - VERIFIED_CREATORS → only buyer roles (AGENCY, ENTERPRISE) and TALENT can see mediaKitUrl
 * - PRIVATE      → only the actor themselves can see mediaKitUrl (shown as hidden)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
export const dynamic = "force-dynamic";

const ACTOR_SELECT = {
  id: true,
  name: true,
  displayName: true,
  bio: true,
  image: true,
  role: true,
  mediaKitUrl: true,
  mediaKitVisibility: true,
  createdAt: true,
  portraits: {
    where: { deletedAt: null },
    select: {
      id: true,
      title: true,
      thumbnailUrl: true,
      frontViewUrl: true,
      sideViewUrl: true,
      backViewUrl: true,
      gender: true,
      roleType: true,
      productionType: true,
      status: true,
    },
    orderBy: { createdAt: "desc" as const },
    take: 5,
  },
};

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.userId) {
      return NextResponse.json(
        { success: false, error: "Login required" },
        { status: 401 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch TALENT users who:
    // 1. Have verified their email (not test accounts)
    // 2. Have at least one active portrait (real listing)
    const actors = await prisma.user.findMany({
      where: {
        role: "TALENT",
        emailVerified: true,
        portraits: { some: { status: "ACTIVE", deletedAt: null } },
      },
      select: ACTOR_SELECT,
      orderBy: { createdAt: "desc" },
    });

    // Apply visibility rules based on current user's role
    const visibleActors = actors.map((actor) => {
      const isSelf = actor.id === currentUser.id;

      if (isSelf) {
        // Actor sees their own full profile
        return actor;
      }

      const visibility = actor.mediaKitVisibility || "PRIVATE";

      if (visibility === "PUBLIC") {
        return actor;
      }

      if (visibility === "VERIFIED_CREATORS") {
        // VERIFIED_CREATORS visible to buyer roles (AGENCY/ENTERPRISE) and TALENT (actor viewing peer)
        const buyerRoles = ["AGENCY", "ENTERPRISE"];
        if (currentUser.role === "TALENT" || buyerRoles.includes(currentUser.role)) {
          return actor;
        }
        const { mediaKitUrl, ...rest } = actor;
        return { ...rest, mediaKitUrl: null };
      }

      // PRIVATE — nobody except owner
      const { mediaKitUrl, ...rest } = actor;
      return { ...rest, mediaKitUrl: null };
    });

    return NextResponse.json({
      success: true,
      data: visibleActors,
    });
  } catch (error) {
    console.error("[GET /api/actors]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}