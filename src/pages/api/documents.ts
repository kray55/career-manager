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
  tags: z.string().max(500).default(""),
});

const updateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
  type: z.enum(["document", "resume", "coverLetter", "other"]).optional(),
  status: z.enum(["draft", "final", "archived"]).optional(),
  tags: z.string().max(500).optional(),
  fileUrl: z.string().max(2048).optional(),
  fileType: z.string().max(100).optional(),
  fileSize: z.number().int().optional(),
});

async function getSession(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return session;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session) return;

  // ── GET /api/documents ──────────────────────
  if (req.method === "GET") {
    try {
      const { search, type, status, id } = req.query;

      if (id && typeof id === "string") {
        const doc = await prisma.document.findUnique({ where: { id } });
        if (!doc || doc.userId !== session.user.id) {
          return res.status(404).json({ error: "Document not found" });
        }
        return res.status(200).json({ document: doc });
      }

      const where: any = { userId: session.user.id };
      if (type && typeof type === "string") where.type = type;
      if (status === "draft") where.status = "draft";
      else if (status === "final") where.status = "final";
      else if (status === "archived") where.status = "archived";
      else if (status !== "all") where.status = { not: "archived" };

      if (search && typeof search === "string" && search.trim()) {
        const s = search.trim();
        where.OR = [
          { title: { contains: s, mode: "insensitive" } },
          { content: { contains: s, mode: "insensitive" } },
          { tags: { contains: s, mode: "insensitive" } },
        ];
      }

      const documents = await prisma.document.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: 100,
      });

      return res.status(200).json({ documents });
    } catch (err) {
      console.error("[Documents API] GET error:", err);
      return res.status(500).json({ error: "Failed to fetch documents" });
    }
  }

  // ── POST /api/documents ─────────────────────
  if (req.method === "POST") {
    try {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
      }
      const doc = await prisma.document.create({
        data: {
          title: parsed.data.title,
          content: parsed.data.content,
          type: parsed.data.type,
          status: parsed.data.status,
          tags: parsed.data.tags,
          userId: session.user.id,
        } as any,
      });
      return res.status(201).json(doc);
    } catch (err) {
      console.error("[Documents API] POST error:", err);
      return res.status(500).json({ error: "Failed to create document" });
    }
  }

  // ── PATCH /api/documents ────────────────────
  if (req.method === "PATCH") {
    try {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
      }

      const existing = await prisma.document.findUnique({ where: { id: parsed.data.id } });
      if (!existing || existing.userId !== session.user.id) {
        return res.status(404).json({ error: "Document not found" });
      }

      const updateData: any = {};
      if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
      if (parsed.data.content !== undefined) updateData.content = parsed.data.content;
      if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
      if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
      if (parsed.data.tags !== undefined) updateData.tags = parsed.data.tags;
      if (parsed.data.fileUrl !== undefined) updateData.fileUrl = parsed.data.fileUrl;
      if (parsed.data.fileType !== undefined) updateData.fileType = parsed.data.fileType;
      if (parsed.data.fileSize !== undefined) updateData.fileSize = parsed.data.fileSize;

      const doc = await prisma.document.update({
        where: { id: parsed.data.id },
        data: updateData as any,
      });

      return res.status(200).json({ success: true, data: doc });
    } catch (err) {
      console.error("[Documents API] PATCH error:", err);
      return res.status(500).json({ error: "Failed to update document" });
    }
  }

  // ── DELETE /api/documents ───────────────────
  if (req.method === "DELETE") {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: "Document ID required" });

      const existing = await prisma.document.findUnique({ where: { id } });
      if (!existing || existing.userId !== session.user.id) {
        return res.status(404).json({ error: "Document not found" });
      }

      await prisma.document.delete({ where: { id } });
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("[Documents API] DELETE error:", err);
      return res.status(500).json({ error: "Failed to delete document" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
