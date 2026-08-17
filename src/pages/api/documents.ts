import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const createSchema = z.object({
  title: z.string().min(1).max(500).default("Untitled Document"),
  content: z.string().default(""),
  type: z.enum(["document", "resume", "coverLetter", "other"]).default("document"),
  status: z.enum(["draft", "final", "archived"]).default("draft"),
  tags: z.union([z.string(), z.array(z.string())]).default(""),
});

const updateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
  type: z.enum(["document", "resume", "coverLetter", "other"]).optional(),
  status: z.enum(["draft", "final", "archived"]).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  fileUrl: z.string().max(2048).optional(),
  fileType: z.string().max(100).optional(),
  fileSize: z.number().int().optional(),
});

function tagsToArray(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => item.split(",")).map((item) => item.trim()).filter(Boolean);
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

async function getUser(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const user = session?.user as any;
  if (!user?.id || !user.tenantId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return user as { id: string; tenantId: string };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUser(req, res);
  if (!user) return;

  try {
    if (req.method === "GET") {
      const { search, type, status, id } = req.query;
      if (id && typeof id === "string") {
        const document = await prisma.document.findFirst({ where: { id, userId: user.id, tenantId: user.tenantId } });
        if (!document) return res.status(404).json({ error: "Document not found" });
        return res.status(200).json({ document });
      }

      const where: any = { userId: user.id, tenantId: user.tenantId };
      if (type && typeof type === "string") where.type = type;
      if (status === "draft" || status === "final" || status === "archived") where.status = status;
      else if (status !== "all") where.status = { not: "archived" };
      if (search && typeof search === "string" && search.trim()) {
        const query = search.trim();
        where.OR = [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
          { tags: { has: query } },
        ];
      }
      const documents = await prisma.document.findMany({ where, orderBy: { updatedAt: "desc" }, take: 100 });
      return res.status(200).json({ documents });
    }

    if (req.method === "POST") {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
      const doc = await prisma.document.create({ data: { title: parsed.data.title, content: parsed.data.content, type: parsed.data.type, status: parsed.data.status, tags: tagsToArray(parsed.data.tags), userId: user.id, tenantId: user.tenantId } });
      return res.status(201).json(doc);
    }

    if (req.method === "PATCH") {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
      const existing = await prisma.document.findFirst({ where: { id: parsed.data.id, userId: user.id, tenantId: user.tenantId } });
      if (!existing) return res.status(404).json({ error: "Document not found" });
      const updateData: any = { ...parsed.data };
      delete updateData.id;
      if (parsed.data.tags !== undefined) updateData.tags = tagsToArray(parsed.data.tags);
      const document = await prisma.document.update({ where: { id: parsed.data.id }, data: updateData });
      return res.status(200).json({ success: true, data: document });
    }

    if (req.method === "DELETE") {
      const id = typeof req.query.id === "string" ? req.query.id : "";
      if (!id) return res.status(400).json({ error: "Document ID required" });
      const existing = await prisma.document.findFirst({ where: { id, userId: user.id, tenantId: user.tenantId } });
      if (!existing) return res.status(404).json({ error: "Document not found" });
      await prisma.document.delete({ where: { id } });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[Documents API] error:", error);
    return res.status(500).json({ error: "Document operation failed" });
  }
}
