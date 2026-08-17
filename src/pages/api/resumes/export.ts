import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const session = await getServerSession(req, res, authOptions);
  const user = session?.user as any;
  if (!user?.id || !user.tenantId) return res.status(401).json({ error: "Unauthorized" });
  const id = typeof req.query.id === "string" ? req.query.id : "";
  if (!id) return res.status(400).json({ error: "Resume ID is required" });

  try {
    const resume = await prisma.resume.findFirst({ where: { id, userId: user.id, tenantId: user.tenantId } });
    if (!resume) return res.status(404).json({ error: "Resume not found" });
    let content: any = {};
    try { content = JSON.parse(resume.content || "{}"); } catch { content = {}; }
    const header = content.header || {};
    const experience = Array.isArray(content.experience) ? content.experience : [];
    const education = Array.isArray(content.education) ? content.education : [];
    const skills = Array.isArray(content.skills) ? content.skills : [];
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(resume.title)}</title><style>body{font-family:Arial,sans-serif;color:#182033;line-height:1.45;margin:40px}.header{text-align:center;border-bottom:2px solid #182033;padding-bottom:16px}.section{margin-top:22px}.section h2{font-size:13px;text-transform:uppercase;border-bottom:1px solid #ccd2dc;padding-bottom:4px}.entry{margin:12px 0}.entry-head{display:flex;justify-content:space-between}.muted{color:#5f6b7a}.skills{display:flex;flex-wrap:wrap;gap:8px}.skill{border:1px solid #ccd2dc;border-radius:14px;padding:3px 10px;font-size:12px}</style></head><body><div class="header"><h1>${escapeHtml(header.fullName || "Your Name")}</h1><div>${escapeHtml(header.title || "")}</div><div class="muted">${[header.email, header.phone, header.location].filter(Boolean).map((v: string) => escapeHtml(String(v))).join(" | ")}</div></div>${header.summary ? `<div class="section"><h2>Professional Summary</h2><p>${escapeHtml(String(header.summary))}</p></div>` : ""}<div class="section"><h2>Experience</h2>${experience.map((item: any) => `<div class="entry"><div class="entry-head"><strong>${escapeHtml(item.role || "Role")}</strong><span class="muted">${escapeHtml(item.startDate || "")} – ${item.current ? "Present" : escapeHtml(item.endDate || "")}</span></div><div class="muted">${escapeHtml(item.company || "")}${item.location ? `, ${escapeHtml(item.location)}` : ""}</div>${Array.isArray(item.bullets) ? `<ul>${item.bullets.filter((b: any) => String(b).trim()).map((b: any) => `<li>${escapeHtml(String(b))}</li>`).join("")}</ul>` : ""}</div>`).join("")}</div>${education.length ? `<div class="section"><h2>Education</h2>${education.map((item: any) => `<div class="entry"><strong>${escapeHtml(item.degree || "")}${item.field ? ` in ${escapeHtml(item.field)}` : ""}</strong><div>${escapeHtml(item.institution || "")}</div></div>`).join("")}</div>` : ""}${skills.length ? `<div class="section"><h2>Skills</h2><div class="skills">${skills.map((item: any) => `<span class="skill">${escapeHtml(item.name || String(item))}</span>`).join("")}</div></div>` : ""}</body></html>`;
    return res.status(200).json({ html, title: resume.title });
  } catch (error) {
    console.error("[Resume export API] error:", error);
    return res.status(500).json({ error: "Failed to export resume" });
  }
}
