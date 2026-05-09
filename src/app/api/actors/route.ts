/**
 * GET /api/actors — List actors for discovery
 * Returns ACTOR users with media kit info filtered by visibility rules
 *
 * Visibility rules:
 * - PUBLIC       → any logged-in user can see mediaKitUrl
 * - VERIFIED_CREATORS → only CREATOR role users can see mediaKitUrl
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

    // Fetch all ACTOR users
    const actors = await prisma.user.findMany({
      where: { role: "ACTOR" },
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
        if (currentUser.role === "CREATOR") {
          return actor;
        }
        // CREATOR sees actor without mediaKitUrl
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