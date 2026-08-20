import type { NextApiRequest, NextApiResponse } from "next";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const user = session?.user as any;
  if (!user?.id || !user.tenantId) return res.status(401).json({ error: "Unauthorized" });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const roomId = typeof req.body?.roomId === "string" ? req.body.roomId : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const subject = typeof req.body?.subject === "string" ? req.body.subject.trim().slice(0, 998) : "";
  const message = typeof req.body?.message === "string" ? req.body.message.trim().slice(0, 4000) : "";
  if (!roomId || !emailPattern.test(email)) return res.status(400).json({ error: "Room and valid guest email are required" });

  try {
    const room = await prisma.chatRoom.findFirst({ where: { id: roomId, tenantId: user.tenantId, ownerId: user.id } });
    if (!room) return res.status(404).json({ error: "Room not found or you are not the owner" });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invite = await prisma.roomInvite.create({
      data: { tenantId: user.tenantId, roomId, createdById: user.id, email, token, expiresAt },
    });

    const baseUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const link = `${baseUrl}/room-invite/${invite.token}`;
    const safe = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] || character));
    const finalSubject = subject || `Invitation to join ${room.name}`;
    const bespokeMessage = message || `You have been invited to join ${room.name} in Career Manager.`;
    const result = await sendEmail({
      to: email,
      subject: finalSubject,
      html: `<p>${safe(bespokeMessage).replace(/\\n/g, "<br />")}</p><p><a href="${safe(link)}">Join the room</a></p><p>This invitation expires in 7 days.</p>`,
      text: `${bespokeMessage}\n\nJoin the room: ${link}\n\nThis invitation expires in 7 days.`,
    });

    if (!result.success) return res.status(502).json({ error: result.error || "Invitation email failed", inviteId: invite.id });
    return res.status(201).json({ inviteId: invite.id, expiresAt, success: true });
  } catch (error) {
    console.error("[Chat Invite API]", error);
    return res.status(500).json({ error: "Invitation failed" });
  }
}
