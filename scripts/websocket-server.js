/**
 * WebSocket Server — Socket.IO integration script
 *
 * Run separately:  node --env-file=.env scripts/websocket-server.js
 *
 * This attaches Socket.IO to an existing HTTP server (e.g., your Next.js custom server).
 * Required env vars:
 *   SOCKET_PORT=3001
 *   REDIS_URL=redis://localhost:6379  (optional, for multi-instance)
 *
 * For single-instance deployments, prefer the SSE endpoint instead:
 *   GET /api/v1/notifications/stream
 */

const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

async function main() {
  const port = parseInt(process.env.SOCKET_PORT ?? "3001", 10);
  const redisUrl = process.env.REDIS_URL;

  // Create Socket.IO server
  const { createServer } = require("http");
  const httpServer = createServer();

  let adapter;
  if (redisUrl) {
    // Multi-instance: use Redis adapter
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    adapter = createAdapter(pubClient, subClient);
    console.log("[WS] Redis adapter enabled for multi-instance");
  }

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/ws",
  });

  if (adapter) io.adapter(adapter);

  // Attach to global for broadcastToUser() in lib/websocket/index.ts
  globalThis.__io = io;

  io.on("connection", (socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    // Authenticate: client sends { token: "..." } on connect
    socket.on("authenticate", async ({ token }) => {
      try {
        const { verifyToken } = require("./dist/lib/auth/jwt");
        const payload = verifyToken(token);
        if (!payload) {
          socket.emit("auth_error", { message: "Invalid token" });
          return;
        }

        const userId = payload.userId;
        socket.data.userId = userId;
        await socket.join(`user:${userId}`);
        socket.emit("authenticated", { userId });
        console.log(`[WS] User ${userId} authenticated on socket ${socket.id}`);
      } catch (err) {
        console.error("[WS] Auth error:", err);
        socket.emit("auth_error", { message: "Authentication failed" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[WS] Client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`[WS] Socket.IO server running on port ${port}`);
    console.log(`[WS] SSE fallback: /api/v1/notifications/stream`);
  });
}

main().catch(console.error);
