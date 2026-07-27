// ──────────────────────────────────────────────
// API Route: /api/affiliate-earnings (T12-D)
// Returns commission data for the current user's
// tenant (all affiliates under that tenant).
// ──────────────────────────────────────────────
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = session.user as any;
  const tenantId = user.tenantId;

  try {
    const earnings = await prisma.affiliateEarning.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return res.status(200).json({ earnings });
  } catch (err) {
    console.error("Failed to fetch affiliate earnings:", err);
    return res.status(500).json({ error: "Failed to fetch earnings" });
  }
}
