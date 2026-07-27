"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// ──────────────────────────────────────────────
// Schemas
// ──────────────────────────────────────────────

export const createResumeSchema = z.object({
  title: z.string().min(1).max(500).default("Untitled Resume"),
  content: z.string().default("{}"),
});

export const updateResumeSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
});

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

async function getAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  const user = session.user as any;
  return { userId: user.id, tenantId: user.tenantId };
}

// ──────────────────────────────────────────────
// CRUD: Create Resume
// ──────────────────────────────────────────────

export async function createResume(data: z.infer<typeof createResumeSchema>) {
  const { userId, tenantId } = await getAuth();
  const parsed = createResumeSchema.parse(data);

  const resume = await prisma.resume.create({
    data: {
      title: parsed.title,
      content: parsed.content,
      version: 1,
      userId,
      tenantId,
    },
  });

  // Create initial history snapshot
  await prisma.resumeHistory.create({
    data: {
      resumeId: resume.id,
      version: 1,
      content: parsed.content,
    },
  });

  return resume;
}

// ──────────────────────────────────────────────
// CRUD: Get All Resumes
// ──────────────────────────────────────────────

export async function getAllResumes() {
  const { userId, tenantId } = await getAuth();

  return prisma.resume.findMany({
    where: { userId, tenantId },
    orderBy: { updatedAt: "desc" },
    include: {
      history: {
        orderBy: { version: "desc" },
        select: { version: true, createdAt: true },
      },
    },
  });
}

// ──────────────────────────────────────────────
// CRUD: Get Resume by ID
// ──────────────────────────────────────────────

export async function getResumeById(id: string) {
  const { userId, tenantId } = await getAuth();

  return prisma.resume.findFirst({
    where: { id, userId, tenantId },
    include: {
      history: {
        orderBy: { version: "desc" },
      },
    },
  });
}

// ──────────────────────────────────────────────
// CRUD: Update Resume (snapshots version)
// ──────────────────────────────────────────────

export async function updateResume(data: z.infer<typeof updateResumeSchema>) {
  const { userId, tenantId } = await getAuth();
  const parsed = updateResumeSchema.parse(data);

  const existing = await prisma.resume.findFirst({
    where: { id: parsed.id, userId, tenantId },
  });
  if (!existing) throw new Error("Resume not found");

  const newVersion = existing.version + 1;

  const updateData: any = { version: newVersion };
  if (parsed.title !== undefined) updateData.title = parsed.title;
  if (parsed.content !== undefined) updateData.content = parsed.content;

  const resume = await prisma.resume.update({
    where: { id: parsed.id },
    data: updateData,
  });

  // Create history snapshot
  await prisma.resumeHistory.create({
    data: {
      resumeId: resume.id,
      version: newVersion,
      content: parsed.content ?? existing.content,
    },
  });

  return resume;
}

// ──────────────────────────────────────────────
// CRUD: Delete Resume
// ──────────────────────────────────────────────

export async function deleteResume(id: string) {
  const { userId, tenantId } = await getAuth();

  await prisma.resume.deleteMany({
    where: { id, userId, tenantId },
  });

  return { success: true };
}

// ──────────────────────────────────────────────
// CRUD: Restore Resume Version
// ──────────────────────────────────────────────

export async function restoreResumeVersion(resumeId: string, version: number) {
  const { userId, tenantId } = await getAuth();

  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId, tenantId },
  });
  if (!resume) throw new Error("Resume not found");

  const snapshot = await prisma.resumeHistory.findUnique({
    where: { resumeId_version: { resumeId, version } },
  });
  if (!snapshot) throw new Error("Version not found");

  const newVersion = resume.version + 1;

  const updated = await prisma.resume.update({
    where: { id: resumeId },
    data: {
      content: snapshot.content,
      version: newVersion,
    },
  });

  // Create a new snapshot for the restored version
  await prisma.resumeHistory.create({
    data: {
      resumeId,
      version: newVersion,
      content: snapshot.content,
    },
  });

  return updated;
}

// ──────────────────────────────────────────────
// Export Resume to PDF (generates HTML for PDF)
// Uses browser print-to-PDF approach (server generates HTML)
// ──────────────────────────────────────────────

export async function exportResumeToPDF(id: string) {
  const { userId, tenantId } = await getAuth();

  const resume = await prisma.resume.findFirst({
    where: { id, userId, tenantId },
  });
  if (!resume) throw new Error("Resume not found");

  let content: any;
  try {
    content = JSON.parse(resume.content);
  } catch {
    content = {};
  }

  const h = content.header || {};
  const experience = content.experience || [];
  const education = content.education || [];
  const skills = content.skills || [];

  // Generate HTML for PDF export
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${resume.title}</title>
  <style>
    @page { margin: .5in; }
    body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1a1a2e; line-height: 1.5; }
    .header { text-align: center; border-bottom: 2px solid #1a1a2e; padding-bottom: 16px; margin-bottom: 20px; }
    .header h1 { font-size: 24pt; margin: ; }
    .header .title { font-size: 14pt; color: #555; margin: 4px ; }
    .header .contact { font-size: 10pt; color: #777; }
    .section { margin-bottom: 16px; }
    .section h2 { font-size: 11pt; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px; }
    .entry { margin-bottom: 10px; }
    .entry-header { display: flex; justify-content: space-between; }
    .entry-header .role { font-weight: bold; }
    .entry-header .dates { font-size: 10pt; color: #777; }
    .entry .company { font-size: 10pt; color: #555; }
    ul { margin: 4px ; padding-left: 18px; }
    li { margin-bottom: 2px; font-size: 10pt; }
    .skills-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .skill-tag { background: #fff; padding: 2px 10px; border-radius: 12px; font-size: 9pt; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${h.fullName || "Your Name"}</h1>
    <div class="title">${h.title || ""}</div>
    <div class="contact">
      ${[h.email, h.phone, h.location].filter(Boolean).join(" | ")}
    </div>
  </div>

  ${h.summary ? `<div class="section"><h2>Professional Summary</h2><p>${h.summary}</p></div>` : ""}

  ${experience.length ? `<div class="section"><h2>Experience</h2>${experience.map((e: any) => `
    <div class="entry">
      <div class="entry-header">
        <span class="role">${e.role || "Role"}</span>
        <span class="dates">${e.startDate || ""} – ${e.current ? "Present" : (e.endDate || "")}</span>
      </div>
      <div class="company">${e.company || ""}${e.location ? `, ${e.location}` : ""}</div>
      ${e.bullets?.filter((b: string) => b.trim()).length ? `<ul>${e.bullets.filter((b: string) => b.trim()).map((b: string) => `<li>${b}</li>`).join("")}</ul>` : ""}
    </div>
  `).join("")}</div>` : ""}

  ${education.length ? `<div class="section"><h2>Education</h2>${education.map((e: any) => `
    <div class="entry">
      <strong>${e.degree || ""}${e.field ? ` in ${e.field}` : ""}</strong>
      <div>${e.institution || ""}${e.gpa ? ` — GPA: ${e.gpa}` : ""}</div>
      <div style="font-size:10pt;color:#777;">${e.startDate || ""} – ${e.endDate || ""}</div>
    </div>
  `).join("")}</div>` : ""}

  ${skills.length ? `<div class="section"><h2>Skills</h2><div class="skills-list">${skills.map((s: any) => `<span class="skill-tag">${s.name || ""}</span>`).join("")}</div></div>` : ""}
</body>
</html>`;

  return {
    html,
    title: resume.title,
    filename: `${resume.title.replace(/[^a-zA-Z-9]/g, "_")}.pdf`,
  };
}
