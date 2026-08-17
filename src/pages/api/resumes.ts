import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function serializeResume(resume: any) {
  return {
    id: resume.id,
    title: resume.title,
    content: resume.content,
    version: resume.version,
    createdAt: resume.createdAt.toISOString(),
    updatedAt: resume.updatedAt.toISOString(),
    history: (resume.history || []).map((item: any) => ({
      version: item.version,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}

function getUser(session: any) {
  return session?.user as { id: string; tenantId: string } | undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const user = getUser(session);
  if (!user?.id || !user.tenantId) return res.status(401).json({ error: "Unauthorized" });

  try {
    if (req.method === "GET") {
      const id = typeof req.query.id === "string" ? req.query.id : undefined;
      const include = { history: { orderBy: { version: "desc" as const }, select: { version: true, createdAt: true } } };
      if (id) {
        const resume = await prisma.resume.findFirst({ where: { id, userId: user.id, tenantId: user.tenantId }, include });
        if (!resume) return res.status(404).json({ error: "Resume not found" });
        return res.status(200).json({ resume: serializeResume(resume) });
      }
      const resumes = await prisma.resume.findMany({ where: { userId: user.id, tenantId: user.tenantId }, orderBy: { updatedAt: "desc" }, include });
      return res.status(200).json(resumes.map(serializeResume));
    }

    if (req.method === "POST") {
      const title = typeof req.body?.title === "string" && req.body.title.trim() ? req.body.title.trim() : "Untitled Resume";
      const content = typeof req.body?.content === "string" ? req.body.content : "{}";
      const resume = await prisma.$transaction(async (tx: any) => {
        const created = await tx.resume.create({ data: { title, content, version: 1, userId: user.id, tenantId: user.tenantId } });
        await tx.resumeHistory.create({ data: { resumeId: created.id, version: 1, content } });
        return created;
      });
      return res.status(201).json(resume);
    }

    if (req.method === "PATCH") {
      const id = typeof req.body?.id === "string" ? req.body.id : "";
      if (!id) return res.status(400).json({ error: "Resume ID is required" });
      const existing = await prisma.resume.findFirst({ where: { id, userId: user.id, tenantId: user.tenantId } });
      if (!existing) return res.status(404).json({ error: "Resume not found" });
      const title = req.body?.title !== undefined ? String(req.body.title || "Untitled Resume") : existing.title;
      const content = req.body?.content !== undefined ? String(req.body.content) : existing.content;
      const version = existing.version + 1;
      const updated = await prisma.$transaction(async (tx: any) => {
        const saved = await tx.resume.update({ where: { id }, data: { title, content, version } });
        await tx.resumeHistory.create({ data: { resumeId: id, version, content } });
        return saved;
      });
      return res.status(200).json({ data: updated });
    }

    if (req.method === "DELETE") {
      const id = typeof req.query.id === "string" ? req.query.id : String(req.body?.id || "");
      if (!id) return res.status(400).json({ error: "Resume ID is required" });
      const deleted = await prisma.resume.deleteMany({ where: { id, userId: user.id, tenantId: user.tenantId } });
      if (!deleted.count) return res.status(404).json({ error: "Resume not found" });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[Resumes API] error:", error);
    return res.status(500).json({ error: "Resume operation failed" });
  }
}
