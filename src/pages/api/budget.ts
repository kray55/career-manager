import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });
  const user = session.user as any;
  const tenantId = user.tenantId;

  if (req.method === "POST") {
    const { type, amount, month, category, note } = req.body;
    if (!type || !amount || !month) return res.status(400).json({ error: "type, amount, month required" });
    const entry = await prisma.budgetItem.create({
      data: { type, amount: parseFloat(amount), month: new Date(month), category: category || null, note: note || null, tenantId },
    });
    return res.json(entry);
  }

  if (req.method === "GET") {
    const items = await prisma.budgetItem.findMany({ where: { tenantId }, orderBy: { month: "asc" } });
    return res.json(items);
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "id required" });
    await prisma.budgetItem.deleteMany({ where: { id: id as string, tenantId } });
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
