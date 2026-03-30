/**
 * GET /api/v1/notifications/stream
 * SSE endpoint for real-time notification delivery.
 * Client subscribes via EventSource to receive push notifications.
 *
 * Usage on client:
 *   const es = new EventSource('/api/v1/notifications/stream?token=ACCESS_TOKEN');
 *   es.addEventListener('notification', (e) => {
 *     const data = JSON.parse(e.data);
 *     // handle notification
 *   });
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

// This endpoint uses SSE (Server-Sent Events) which is natively supported
// by Next.js API routes without requiring a custom server.
// WebSocket/Socket.IO can be added on top for production clusters.
export async function GET(request: NextRequest) {
  // Authenticate via query param token (EventSource doesn't send cookies)
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ success: false, error: "Missing token" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
  }

  const userId = payload.userId;

  // Set SSE headers
  const encoder = new TextEncoder();
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode("event: connected\ndata: {\"status\":\"ok\"}\n\n"));

      // Poll for new unread notifications every 5 seconds
      // In production, replace with Redis pub/sub or Socket.IO for instant push
      let lastUnreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      // Send initial unread count
      controller.enqueue(
        encoder.encode(`event: unread_count\ndata: ${JSON.stringify({ count: lastUnreadCount })}\n\n`)
      );

      const interval = setInterval(async () => {
        if (isClosed) {
          clearInterval(interval);
          return;
        }

        try {
          const currentUnreadCount = await prisma.notification.count({
            where: { userId, isRead: false },
          });

          if (currentUnreadCount !== lastUnreadCount) {
            lastUnreadCount = currentUnreadCount;
            controller.enqueue(
              encoder.encode(`event: unread_count\ndata: ${JSON.stringify({ count: currentUnreadCount })}\n\n`)
            );
          }

          // Heartbeat to keep connection alive
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(interval);
        }
      }, 5000);

      // Clean up on client disconnect
      request.signal.addEventListener("abort", () => {
        isClosed = true;
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
