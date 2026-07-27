/**
 * T9-A: Socket.io Server
 * Attached to Next.js HTTP server via pages/api/socket legacy route.
 * Handles real-time chat with tenant-based rooms.
 */

import { Server as NetServer } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";
import prisma from "@/lib/prisma";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Simple email regex to detect email addresses in messages
const EMAIL_REGEX = /[a-zA-Z-9._%+-]+@[a-zA-Z-9.-]+\.[a-zA-Z]{2,}/g;

interface SocketServerWithIO extends NetServer {
  io?: SocketIOServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    const httpServer: SocketServerWithIO = res.socket.server;
    const io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    httpServer.io = io;

    io.on("connection", (socket) => {
      const tenantId = socket.handshake.query.tenantId as string;
      const userId = socket.handshake.query.userId as string;
      const userName = socket.handshake.query.userName as string || "Anonymous";

      if (!tenantId) {
        socket.disconnect();
        return;
      }

      // Join tenant room
      const room = `tenant:${tenantId}`;
      socket.join(room);
      console.log(`[Socket] User ${userName} (${userId}) joined room ${room}`);

      // T9-C: Emit last 50 messages to the client
      socket.on("chat:history", async () => {
        try {
          const messages = await prisma.chatMessage.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            take: 50,
            select: {
              id: true,
              senderId: true,
              senderName: true,
              content: true,
              createdAt: true,
            },
          });
          socket.emit("chat:history", messages.reverse());
        } catch {
          socket.emit("chat:history", []);
        }
      });

      // T9-D: On new message, save to DB and broadcast to tenant room
      socket.on("chat:message", async (data: { content: string }) => {
        if (!data.content?.trim()) return;

        try {
          const message = await prisma.chatMessage.create({
            data: {
              tenantId,
              senderId: userId,
              senderName: userName,
              content: data.content.trim(),
            },
          });

          const payload = {
            id: message.id,
            senderId: message.senderId,
            senderName: message.senderName,
            content: message.content,
            createdAt: message.createdAt.toISOString(),
          };

          // Broadcast to everyone in tenant room including sender
          io.to(room).emit("chat:message", payload);

          // T10-C: Auto-create Contact if message contains an email address
          const emails = data.content.match(EMAIL_REGEX);
          if (emails) {
            for (const email of emails) {
              const existing = await prisma.contact.findFirst({
                where: { tenantId, email },
              });
              if (!existing) {
                await prisma.contact.create({
                  data: {
                    tenantId,
                    email,
                    name: userName, // Default name from sender
                    status: "PROSPECTIVE",
                    notes: "Auto-created from chat message by " + userName + " on " + new Date().toISOString(),
                  },
                });
                console.log(`[Socket] Auto-created Contact for ${email}`);
              }
            }
          }
        } catch (err) {
          console.error("[Socket] Failed to save message:", err);
          socket.emit("chat:error", { message: "Failed to save message" });
        }
      });

      // Notify button - triggers SMTP email via the hub
      socket.on("chat:notify", async (data: { to: string; subject: string; body: string }) => {
        try {
          const { sendEmail } = await import("@/lib/email");
          const result = await sendEmail({
            to: data.to,
            subject: data.subject || "New Chat Notification from Career Manager",
            html: `<p>${data.body}</p>`,
          });

          // Log the email
          await prisma.emailLog.create({
            data: {
              tenantId,
              userId,
              to: data.to,
              subject: data.subject || "Chat Notification",
              html: data.body,
              status: result.success ? "SENT" : "FAILED",
              errorMsg: result.error || null,
              sentAt: result.success ? new Date() : null,
            },
          });

          socket.emit("chat:notify:result", {
            success: result.success,
            messageId: result.messageId,
            error: result.error,
          });
        } catch (err: any) {
          socket.emit("chat:notify:result", {
            success: false,
            error: err?.message || "Failed to send notification",
          });
        }
      });

      socket.on("disconnect", () => {
        console.log(`[Socket] User ${userName} (${userId}) disconnected from ${room}`);
      });
    });

    console.log("[Socket] Socket.io server initialized");
  }

  res.end();
}
