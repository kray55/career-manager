import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const createSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  description: z.string().optional().default(""),
  favicon: z.string().optional().nullable(),
});

const updateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
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

  // ── GET /api/bookmarks ──────────────────────────
  if (req.method === "GET") {
    const { search, limit } = req.query;
    try {
      const where: any = { userId: session.user.id };
      if (search && typeof search === "string" && search.trim()) {
        const s = search.trim();
        where.OR = [
          { title: { contains: s, mode: "insensitive" } },
          { description: { contains: s, mode: "insensitive" } },
          { url: { contains: s, mode: "insensitive" } },
          { tags: { has: s } },
        ];
      }
      const take = Math.min(parseInt(limit as string) || 100, 200);
      const bookmarks = await prisma.bookmark.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
      });
      return res.status(200).json({ bookmarks });
    } catch (err) {
      console.error("[Bookmarks API] GET error:", err);
      return res.status(500).json({ error: "Failed to fetch bookmarks" });
    }
  }

  // ── POST /api/bookmarks ─────────────────────────
  if (req.method === "POST") {
    try {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }
      const bookmark = await prisma.bookmark.create({
        data: {
          url: parsed.data.url,
          title: parsed.data.title,
          description: parsed.data.description || null,
          favicon: parsed.data.favicon || null,
          userId: session.user.id,
        } as any,
      });
      return res.status(201).json(bookmark);
    } catch (err) {
      console.error("[Bookmarks API] POST error:", err);
      return res.status(500).json({ error: "Failed to create bookmark" });
    }
  }

  // ── PATCH /api/bookmarks ────────────────────────
  if (req.method === "PATCH") {
    try {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
      }

      // Verify ownership
      const existing = await prisma.bookmark.findUnique({ where: { id: parsed.data.id } });
      if (!existing || existing.userId !== session.user.id) {
        return res.status(404).json({ error: "Bookmark not found" });
      }

      const updateData: any = {};
      if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
      if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
      if (parsed.data.isFavorite !== undefined) updateData.isFavorite = parsed.data.isFavorite;
      if (parsed.data.tags !== undefined) updateData.tags = parsed.data.tags;

      const bookmark = await prisma.bookmark.update({
        where: { id: parsed.data.id },
        data: updateData,
      });

      return res.status(200).json({ success: true, data: bookmark });
    } catch (err) {
      console.error("[Bookmarks API] PATCH error:", err);
      return res.status(500).json({ error: "Failed to update bookmark" });
    }
  }

  // ── DELETE /api/bookmarks ───────────────────────
  if (req.method === "DELETE") {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: "Bookmark ID required" });

      const existing = await prisma.bookmark.findUnique({ where: { id } });
      if (!existing || existing.userId !== session.user.id) {
        return res.status(404).json({ error: "Bookmark not found" });
      }

      await prisma.bookmark.delete({ where: { id } });
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("[Bookmarks API] DELETE error:", err);
      return res.status(500).json({ error: "Failed to delete bookmark" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
