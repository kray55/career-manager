import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authenticator } from "otplib";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

    const { secret, token } = req.body;
    if (!secret || !token) return res.status(400).json({ error: "Secret and token are required" });

    authenticator.options = { window: 1 };
    if (!authenticator.check(token, secret)) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { totpEnabled: true, totpVerifiedAt: new Date() },
    });

    return res.status(200).json({ success: true, message: "2FA enabled successfully" });
  } catch (error) {
    console.error("[TOTP Verify]", error);
    return res.status(500).json({ error: "Failed to verify TOTP code" });
  }
}
