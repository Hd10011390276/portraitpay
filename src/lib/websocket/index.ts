// WebSocket Server Setup (Socket.IO)
// For production use with multiple Next.js instances.
//
// Usage:
//   node --env-file=.env scripts/websocket-server.js
//
// Or integrate with your custom server (server.js):
//   const { setupWebSocket } = require('./src/lib/websocket');
//   setupWebSocket(httpServer);
//
// This file is a RESERVATION: it defines the integration contract.
// In a single-instance deployment, the SSE endpoint (/notifications/stream)
// provides equivalent real-time delivery without extra infrastructure.

/**
 * WebSocket notification event types
 */
export type WsNotificationEvent = {
  type: "notification";
  payload: {
    id: string;
    title: string;
    body: string;
    type: string;
    data: Record<string, unknown> | null;
    createdAt: string;
  };
};

export type WsUnreadCountEvent = {
  type: "unread_count";
  payload: { count: number };
};

export type WsEvent = WsNotificationEvent | WsUnreadCountEvent;

// Global Socket.IO instance (set by websocket-server.js)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getIO = (): any => (globalThis as any).__io;

/**
 * Broadcast a notification to all sockets of a given user.
 * Call this after createNotification() in your business logic.
 *
 * Example:
 *   import { broadcastToUser } from '@/lib/websocket';
 *   const notification = await createNotification({ userId, type: 'EARNING', ... });
 *   broadcastToUser(userId, { type: 'notification', payload: notification });
 */
export function broadcastToUser(userId: string, event: WsEvent) {
  const io = getIO();
  if (io) {
    io.to(`user:${userId}`).emit("notification", event);
  }
  // Log for debugging in development
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[WS] Broadcast to user ${userId}:`, JSON.stringify(event));
  }
}
