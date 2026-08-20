import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function readRoomId(req: NextApiRequest) {
  const value = req.query.roomId;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function getUser(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const user = session?.user as any;
  if (!user?.id || !user.tenantId) return null;
  return { id: user.id as string, tenantId: user.tenantId as string, name: (user.name || "User") as string };
}

async function verifyRoomAccess(roomId: string | undefined, userId: string, tenantId: string) {
  if (!roomId) return true;
  const membership = await prisma.chatRoomMember.findFirst({
    where: { roomId, userId },
    include: { room: { select: { tenantId: true } } },
  });
  return Boolean(membership && membership.room.tenantId === tenantId);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUser(req, res);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const roomId = readRoomId(req);
  try {
    if (!(await verifyRoomAccess(roomId, user.id, user.tenantId))) {
      return res.status(403).json({ error: "You do not have access to this room" });
    }

    if (req.method === "GET") {
      const messages = await prisma.chatMessage.findMany({
        where: roomId ? { tenantId: user.tenantId, roomId } : { tenantId: user.tenantId, roomId: null },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, senderId: true, senderName: true, content: true, createdAt: true, roomId: true },
      });
      return res.status(200).json({ messages: messages.reverse() });
    }

    if (req.method === "POST") {
      const content = typeof req.body?.content === "string" ? req.body.content.trim().slice(0, 4000) : "";
      if (!content) return res.status(400).json({ error: "Message content is required" });
      const message = await prisma.chatMessage.create({
        data: {
          tenantId: user.tenantId,
          roomId: roomId || null,
          senderId: user.id,
          senderName: user.name,
          content,
        },
        select: { id: true, senderId: true, senderName: true, content: true, createdAt: true, roomId: true },
      });
      return res.status(201).json({ message });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[Chat Messages API]", error);
    return res.status(500).json({ error: "Chat operation failed" });
  }
}
