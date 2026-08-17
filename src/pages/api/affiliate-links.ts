import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function makeCode() { return `cm-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-4)}`; }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const user = session?.user as any;
  if (!user?.id || !user.tenantId) return res.status(401).json({ error: "Unauthorized" });
  try {
    if (req.method === "GET") {
      const links = await prisma.affiliateLink.findMany({ where: { tenantId: user.tenantId, userId: user.id }, orderBy: { createdAt: "desc" } });
      const earnings = await prisma.affiliateEarning.findMany({ where: { tenantId: user.tenantId, affiliateLinkId: { in: links.map((link: any) => link.id) } }, orderBy: { createdAt: "desc" }, take: 50 });
      return res.status(200).json({ links, earnings, totalEarned: earnings.reduce((sum: number, earning: any) => sum + earning.commissionAmount, 0) });
    }
    if (req.method === "POST") {
      const destinationUrl = typeof req.body?.destinationUrl === "string" && req.body.destinationUrl.startsWith("/") ? req.body.destinationUrl : "/store";
      const link = await prisma.affiliateLink.create({ data: { tenantId: user.tenantId, userId: user.id, referralCode: makeCode(), destinationUrl } });
      return res.status(201).json({ link, shareUrl: `${process.env.NEXTAUTH_URL || ""}${destinationUrl}?ref=${link.referralCode}` });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[Affiliate API]", error);
    return res.status(500).json({ error: "Affiliate operation failed" });
  }
}
