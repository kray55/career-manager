import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const user = session?.user as any;
  if (!user?.id || !user.tenantId) return res.status(401).json({ error: "Unauthorized" });

  try {
    if (req.method === "GET") {
      const rooms = await prisma.chatRoom.findMany({
        where: { tenantId: user.tenantId, members: { some: { userId: user.id } } },
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { members: true, messages: true } } },
      });
      return res.status(200).json({ rooms });
    }

    if (req.method === "POST") {
      const name = typeof req.body?.name === "string" ? req.body.name.trim().slice(0, 120) : "";
      const description = typeof req.body?.description === "string" ? req.body.description.trim().slice(0, 500) : "";
      const type = req.body?.type === "INVITE_ONLY" ? "INVITE_ONLY" : "PRIVATE";
      if (!name) return res.status(400).json({ error: "Room name is required" });

      const room = await prisma.chatRoom.create({
        data: {
          tenantId: user.tenantId,
          ownerId: user.id,
          name,
          description,
          type,
          members: { create: { userId: user.id, role: "OWNER" } },
        },
        include: { _count: { select: { members: true, messages: true } } },
      });
      return res.status(201).json({ room });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[Chat Rooms API]", error);
    return res.status(500).json({ error: "Room operation failed" });
  }
}
