import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const user = session.user as any;

  if (req.method === "GET") {
    const { to, contactId } = req.query;

    const where: any = {
      tenantId: user.tenantId,
    };

    // Filter by recipient email or userId (contactId)
    if (to) where.to = { contains: to as string };
    if (contactId) where.userId = contactId as string;

    const logs = await prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const serialized = logs.map((log: any) => ({
      id: log.id,
      to: log.to,
      subject: log.subject,
      status: log.status,
      sentAt: log.sentAt?.toISOString() || null,
      createdAt: log.createdAt.toISOString(),
      errorMsg: log.errorMsg,
    }));

    return res.status(200).json(serialized);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
