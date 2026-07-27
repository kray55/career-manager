import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authenticator } from "otplib";
import { toDataURL } from "qrcode";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

    const secret = authenticator.generateSecret();
    const userName = session.user.email || session.user.id;
    const otpauth = authenticator.keyuri(userName, "Career Manager", secret);
    const qrCode = await toDataURL(otpauth);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { totpSecret: secret },
    });

    return res.status(200).json({ secret, qrCode });
  } catch (error) {
    console.error("[TOTP Generate]", error);
    return res.status(500).json({ error: "Failed to generate TOTP secret" });
  }
}
