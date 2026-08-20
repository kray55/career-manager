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

    const configuredUrl = process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "";
    const baseUrl = configuredUrl && !configuredUrl.includes("career-manager.vercel.app")
      ? configuredUrl.replace(/\/$/, "")
      : "https://career-manager-iota.vercel.app";
    const link = `${baseUrl}/room-invite/${invite.token}`;
    const safe = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] || character));
    const finalSubject = subject || `Invitation to join ${room.name}`;
    const bespokeMessage = message || `You have been invited to join ${room.name} in Career Manager.`;
    const safeRoomName = safe(room.name);
    const safeMessage = safe(bespokeMessage).replace(/\r?\n/g, "<br />");
    const result = await sendEmail({
      to: email,
      subject: finalSubject,
      html: `<!doctype html><html><body style="margin:0;background:#eef4fb;font-family:Arial,sans-serif;color:#172033"><div style="max-width:620px;margin:32px auto;padding:0 16px"><div style="background:#0b1830;border-radius:20px 20px 0 0;padding:28px 32px;color:#fff"><div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8ee7ff">Career Manager</div><h1 style="margin:12px 0 0;font-size:26px;line-height:1.2">You’re invited to join ${safeRoomName}</h1></div><div style="background:#fff;padding:32px;border:1px solid #dbe5f0;border-top:0"><div style="font-size:15px;line-height:1.7;color:#344054">${safeMessage}</div><div style="margin:26px 0;text-align:center"><a href="${safe(link)}" style="display:inline-block;background:#087ea4;color:#fff;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:700">Join the room</a></div><div style="background:#f5f8fc;border-radius:12px;padding:16px;font-size:13px;line-height:1.6;color:#667085"><strong>Invitation details</strong><br>Room: ${safeRoomName}<br>Access: Invite-only<br>Expires: ${expiresAt.toLocaleString()}</div></div><div style="padding:18px 24px;text-align:center;color:#667085;font-size:11px">This secure invitation expires in 7 days. If you were not expecting it, you can safely ignore this email.</div></div></body></html>`,
      text: `${bespokeMessage}\n\nJoin the room: ${link}\n\nRoom: ${room.name}\nThis invitation expires on ${expiresAt.toLocaleString()}.`,
    });

    if (!result.success) return res.status(502).json({ error: result.error || "Invitation email failed", inviteId: invite.id });
    return res.status(201).json({ inviteId: invite.id, expiresAt, success: true });
  } catch (error) {
    console.error("[Chat Invite API]", error);
    return res.status(500).json({ error: "Invitation failed" });
  }
}
