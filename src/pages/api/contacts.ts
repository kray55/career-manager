import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });
  const user = session.user as any;

  // GET: List all contacts for tenant
  if (req.method === "GET") {
    const contacts = await prisma.contact.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { updatedAt: "desc" },
    });
    return res.status(200).json(contacts);
  }

  // POST: Create a new contact
  if (req.method === "POST") {
    const { name, email, company, status } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const existing = await prisma.contact.findFirst({
      where: { tenantId: user.tenantId, email },
    });
    if (existing) return res.status(409).json({ error: "Contact with this email already exists" });

    const contact = await prisma.contact.create({
      data: {
        tenantId: user.tenantId,
        name: name || "",
        email,
        company: company || "",
        status: status || "PROSPECTIVE",
      },
    });
    return res.status(201).json(contact);
  }

  // PATCH: Update contact status (for Kanban drag-and-drop)
  if (req.method === "PATCH") {
    const { id, status, name, company, notes } = req.body;
    if (!id) return res.status(400).json({ error: "ID is required" });

    const updateData: any = {};
    if (status) updateData.status = status;
    if (name !== undefined) updateData.name = name;
    if (company !== undefined) updateData.company = company;
    if (notes !== undefined) updateData.notes = notes;

    const contact = await prisma.contact.updateMany({
      where: { id, tenantId: user.tenantId },
      data: updateData,
    });

    if (contact.count < 1) return res.status(404).json({ error: "Contact not found" });
    return res.status(200).json({ success: true });
  }

  // DELETE: Remove a contact
  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "ID is required" });

    await prisma.contact.deleteMany({
      where: { id, tenantId: user.tenantId },
    });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
