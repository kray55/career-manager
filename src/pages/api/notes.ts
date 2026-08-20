import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const createSchema = z.object({
  title: z.string().min(1).max(500).default("Untitled Note"),
  content: z.string().default(""),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  jobUrl: z.string().max(2048).optional().nullable(),
  pinned: z.boolean().optional().default(false),
});

const updateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  jobUrl: z.string().max(2048).optional().nullable(),
  pinned: z.boolean().optional(),
  archived: z.boolean().optional(),
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
  const tenantId = (session.user as any).tenantId as string | undefined;
  if (!tenantId) return res.status(500).json({ error: "Session tenant is unavailable" });

  // ── GET /api/notes ──────────────────────────
  if (req.method === "GET") {
    try {
      const { id, search, archived, pinned } = req.query;

      // Single note fetch
      if (id && typeof id === "string") {
        const note = await prisma.note.findUnique({ where: { id } });
        if (!note || note.tenantId !== tenantId || note.userId !== session.user.id) {
          return res.status(404).json({ error: "Note not found" });
        }
        return res.status(200).json({ note });
      }

      // List notes
      const where: any = { tenantId, userId: session.user.id };
      
      // Archived filter
      if (archived === "true") where.archived = true;
      else if (archived === "false") where.archived = false;
      else if (archived === "all") { /* no filter */ }
      else where.archived = false; // default: show non-archived

      // Pinned filter
      if (pinned === "true") where.pinned = true;

      // Search
      if (search && typeof search === "string" && search.trim()) {
        const s = search.trim();
        where.OR = [
          { title: { contains: s, mode: "insensitive" } },
          { content: { contains: s, mode: "insensitive" } },
        ];
      }

      const notes = await prisma.note.findMany({
        where,
        orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
        take: 100,
      });

      return res.status(200).json({ notes });
    } catch (err) {
      console.error("[Notes API] GET error:", err);
      return res.status(500).json({ error: "Failed to fetch notes" });
    }
  }

  // ── POST /api/notes ─────────────────────────
  if (req.method === "POST") {
    try {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }
      const note = await prisma.note.create({
        data: {
          tenantId,
          title: parsed.data.title,
          content: parsed.data.content,
          tags: parsed.data.tags,
          jobUrl: parsed.data.jobUrl || null,
          pinned: parsed.data.pinned,
          userId: session.user.id,
        } as any,
      });
      return res.status(201).json(note);
    } catch (err) {
      console.error("[Notes API] POST error:", err);
      return res.status(500).json({ error: "Failed to create note" });
    }
  }

  // ── PATCH /api/notes ────────────────────────
  if (req.method === "PATCH") {
    try {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors });
      }

      const existing = await prisma.note.findUnique({ where: { id: parsed.data.id } });
      if (!existing || existing.tenantId !== tenantId || existing.userId !== session.user.id) {
        return res.status(404).json({ error: "Note not found" });
      }

      const updateData: any = {};
      if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
      if (parsed.data.content !== undefined) updateData.content = parsed.data.content;
      if (parsed.data.tags !== undefined) updateData.tags = parsed.data.tags;
      if (parsed.data.jobUrl !== undefined) updateData.jobUrl = parsed.data.jobUrl;
      if (parsed.data.pinned !== undefined) updateData.pinned = parsed.data.pinned;
      if (parsed.data.archived !== undefined) updateData.archived = parsed.data.archived;

      const note = await prisma.note.update({
        where: { id: parsed.data.id },
        data: updateData as any,
      });

      return res.status(200).json({ success: true, data: note });
    } catch (err) {
      console.error("[Notes API] PATCH error:", err);
      return res.status(500).json({ error: "Failed to update note" });
    }
  }

  // ── DELETE /api/notes ───────────────────────
  if (req.method === "DELETE") {
    try {
      const id = req.query.id as string;
      if (!id) return res.status(400).json({ error: "Note ID required" });

      const existing = await prisma.note.findUnique({ where: { id } });
      if (!existing || existing.tenantId !== tenantId || existing.userId !== session.user.id) {
        return res.status(404).json({ error: "Note not found" });
      }

      await prisma.note.delete({ where: { id } });
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("[Notes API] DELETE error:", err);
      return res.status(500).json({ error: "Failed to delete note" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
