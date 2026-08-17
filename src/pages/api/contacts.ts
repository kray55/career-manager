import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const statuses = new Set(["PROSPECTIVE", "MEETING", "APPLIED", "CLOSED"]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const user = session?.user as any;
  if (!user?.id || !user.tenantId) return res.status(401).json({ error: "Unauthorized" });

  try {
    if (req.method === "GET") {
      const contacts = await prisma.contact.findMany({ where: { tenantId: user.tenantId }, orderBy: { updatedAt: "desc" } });
      return res.status(200).json(contacts);
    }

    if (req.method === "POST") {
      const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
      if (!email) return res.status(400).json({ error: "Email is required" });
      const existing = await prisma.contact.findFirst({ where: { tenantId: user.tenantId, email } });
      if (existing) return res.status(409).json({ error: "Contact with this email already exists" });
      const status = statuses.has(req.body?.status) ? req.body.status : "PROSPECTIVE";
      const contact = await prisma.contact.create({ data: { tenantId: user.tenantId, name: String(req.body?.name || ""), email, company: String(req.body?.company || ""), status, notes: String(req.body?.notes || "") } });
      return res.status(201).json(contact);
    }

    if (req.method === "PATCH") {
      const id = typeof req.body?.id === "string" ? req.body.id : "";
      if (!id) return res.status(400).json({ error: "ID is required" });
      const updateData: any = {};
      if (req.body?.status !== undefined) {
        if (!statuses.has(req.body.status)) return res.status(400).json({ error: "Invalid contact status" });
        updateData.status = req.body.status;
      }
      if (req.body?.name !== undefined) updateData.name = String(req.body.name);
      if (req.body?.company !== undefined) updateData.company = String(req.body.company);
      if (req.body?.notes !== undefined) updateData.notes = String(req.body.notes);
      const result = await prisma.contact.updateMany({ where: { id, tenantId: user.tenantId }, data: updateData });
      if (!result.count) return res.status(404).json({ error: "Contact not found" });
      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      const id = typeof req.query.id === "string" ? req.query.id : String(req.body?.id || "");
      if (!id) return res.status(400).json({ error: "ID is required" });
      const result = await prisma.contact.deleteMany({ where: { id, tenantId: user.tenantId } });
      if (!result.count) return res.status(404).json({ error: "Contact not found" });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[Contacts API] error:", error);
    return res.status(500).json({ error: "Contact operation failed" });
  }
}
