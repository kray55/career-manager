import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const user = session.user as any;

  if (req.method === "GET") {
    const resumes = await prisma.resume.findMany({
      where: { userId: user.id, tenantId: user.tenantId },
      orderBy: { updatedAt: "desc" },
      include: {
        history: {
          orderBy: { version: "desc" },
          select: { version: true, createdAt: true },
        },
      },
    });

    const serialized = resumes.map((r: any) => ({
      id: r.id,
      title: r.title,
      version: r.version,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      history: r.history.map((h: any) => ({
        version: h.version,
        createdAt: h.createdAt.toISOString(),
      })),
    }));

    return res.status(200).json(serialized);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
