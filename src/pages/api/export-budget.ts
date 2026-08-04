import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });
  const user = session.user as any;

  const items = await prisma.budgetItem.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { month: "asc" },
  });

  const header = "Type,Amount,Month,Category,Note\n";
  const rows = items.map((i: any) => `${i.type},${i.amount},${i.month.toISOString().slice(0, 10)},${i.category || ""},"${(i.note || "").replace(/"/g, '""')}"`).join("\n");
  const csv = header + rows;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=budget-export.csv");
  return res.send(csv);
}
