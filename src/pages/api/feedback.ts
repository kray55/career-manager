import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const user = session?.user as any;
  const tenantId = user?.tenantId || "fallback";

  if (req.method === "POST") {
    const { rating, message, page } = req.body;
    if (!rating || !message) return res.status(400).json({ error: "rating and message required" });
    const feedback = await prisma.feedback.create({
      data: {
        tenantId,
        userId: user?.id || null,
        rating: parseInt(rating),
        message,
        page: page || null,
      },
    });
    return res.json(feedback);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
