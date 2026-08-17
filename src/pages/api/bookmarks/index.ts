import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const createSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional().default(""),
  favicon: z.string().optional().nullable(),
  emoji: z.string().max(8).optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
});

const updateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  emoji: z.string().max(8).optional().nullable(),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

async function getUser(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const user = session?.user as any;
  if (!user?.id || !user.tenantId) { res.status(401).json({ error: "Unauthorized" }); return null; }
  return user as { id: string; tenantId: string };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUser(req, res);
  if (!user) return;
  try {
    if (req.method === "GET") {
      const { search, limit } = req.query;
      const where: any = { userId: user.id, tenantId: user.tenantId };
      if (search && typeof search === "string" && search.trim()) {
        const s = search.trim();
        where.OR = [{ title: { contains: s, mode: "insensitive" } }, { description: { contains: s, mode: "insensitive" } }, { url: { contains: s, mode: "insensitive" } }, { tags: { has: s } }];
      }
      const take = Math.min(parseInt(limit as string) || 100, 200);
      return res.status(200).json({ bookmarks: await prisma.bookmark.findMany({ where, orderBy: { createdAt: "desc" }, take }) });
    }
    if (req.method === "POST") {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
      const bookmark = await prisma.bookmark.create({ data: { ...parsed.data, description: parsed.data.description || null, favicon: parsed.data.favicon || null, userId: user.id, tenantId: user.tenantId } });
      return res.status(201).json(bookmark);
    }
    if (req.method === "PATCH") {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
      const existing = await prisma.bookmark.findFirst({ where: { id: parsed.data.id, userId: user.id, tenantId: user.tenantId } });
      if (!existing) return res.status(404).json({ error: "Bookmark not found" });
      const { id, ...data } = parsed.data;
      return res.status(200).json({ success: true, data: await prisma.bookmark.update({ where: { id }, data }) });
    }
    if (req.method === "DELETE") {
      const id = typeof req.query.id === "string" ? req.query.id : "";
      if (!id) return res.status(400).json({ error: "Bookmark ID required" });
      const result = await prisma.bookmark.deleteMany({ where: { id, userId: user.id, tenantId: user.tenantId } });
      if (!result.count) return res.status(404).json({ error: "Bookmark not found" });
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[Bookmarks API] error:", error);
    return res.status(500).json({ error: "Bookmark operation failed" });
  }
}
