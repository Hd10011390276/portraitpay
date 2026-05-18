/**
 * /admin — Admin Dashboard root
 * Lists available admin sections or redirects to default.
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/admin/contacts", req.url));
}