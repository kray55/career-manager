"use client";

import { useState, useCallback } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
// Use client helper to avoid bundling server-only prisma
import { createDocumentClient } from "@/actions/documents.client";

interface Props {
  user: { name: string; email: string; role: string; tenantSlug: string };
}

interface Template {
  id: string;
  title: string;
  description: string;
  type: string;
  icon: string;
  color: string;
  content: string;
}

const TEMPLATES: Template[] = [
  {
    id: "resume-modern",
    title: "Modern Resume",
    description: "A clean, ATS-friendly resume template with sections for experience, education, and skills.",
    type: "resume",
    icon: "M10 6H5a2 2 00-2 2v9a2 2 002 2h14a2 2 002-2V8a2 2 00-2-2h-5m-4 V5a2 2 00-2-2H8a2 2 00-2 2v1m4 a2 2 00-2-2H8a2 2 00-2 2v1m4 a2 2 00-2-2H8a2 2 00-2 2m10 4h-4m h-4m4 v4m-4h4",
    color: "green",
    content: "<h1>Your Name</h1><p>Email | Phone | Location | LinkedIn</p><hr/><h2>Professional Summary</h2><p>A brief summary of your experience and career goals...</p><h2>Experience</h2><h3>Job Title — Company Name</h3><p><em>Start Date – End Date</em></p><ul><li>Achievement or responsibility</li><li>Achievement or responsibility</li></ul><h2>Education</h2><h3>Degree — University</h3><p><em>Graduation Year</em></p><h2>Skills</h2><p>Skill 1, Skill 2, Skill 3</p>",
  },
  {
    id: "resume-creative",
    title: "Creative Resume",
    description: "A visually distinctive resume template for creative roles and design positions.",
    type: "resume",
    icon: "M10 6H5a2 2 00-2 2v9a2 2 002 2h14a2 2 002-2V8a2 2 00-2-2h-5m-4 V5a2 2 00-2-2H8a2 2 00-2 2v1m4 a2 2 00-2-2H8a2 2 00-2 2v1m4 a2 2 00-2-2H8a2 2 00-2 2m10 4h-4m h-4m4 v4m-4h4",
    color: "purple",
    content: "<h1 style='color: #7c3aed;'>YOUR NAME</h1><div style='background: #f5f3ff; padding: 1rem; border-radius: 8px;'><p>Email | Phone | Portfolio</p></div><hr/><h2 style='color: #7c3aed;'>Experience</h2><h3>Job Title — Company</h3><ul><li>Key achievement</li></ul><h2 style='color: #7c3aed;'>Skills</h2><p>Skill 1 · Skill 2 · Skill 3</p>",
  },
  {
    id: "cover-letter-standard",
    title: "Standard Cover Letter",
    description: "A professional cover letter template with placeholders for personalization.",
    type: "coverLetter",
    icon: "M3 8l7.89 5.26a2 2 01  2.96L3 20V8z M3 8l7.89-5.26a2 2 01 -2.96L3 8z",
    color: "blue",
    content: "<h2>Your Name</h2><p>Email | Phone | Location</p><p>Date</p><hr/><h3>Hiring Manager</h3><p>Company Name</p><p>Company Address</p><br/><p>Dear Hiring Manager,</p><br/><p>I am writing to express my interest in the <strong>[Job Title]</strong> position at <strong>[Company Name]</strong>...</p><br/><p>Sincerely,<br/>Your Name</p>",
  },
  {
    id: "cover-letter-short",
    title: "Short Cover Letter",
    description: "A concise, modern cover letter for quick applications.",
    type: "coverLetter",
    icon: "M3 8l7.89 5.26a2 2 01  2.96L3 20V8z M3 8l7.89-5.26a2 2 01 -2.96L3 8z",
    color: "indigo",
    content: "<h2>Your Name</h2><p>Email | Phone</p><hr/><p>Dear <strong>[Company Name]</strong> team,</p><br/><p>I'm excited to apply for the <strong>[Job Title]</strong> role. I bring [X] years of experience in [field] and am confident I can contribute to your team.</p><br/><p>Best,<br/>Your Name</p>",
  },
  {
    id: "document-general",
    title: "General Document",
    description: "A versatile document template for career notes, research, or references.",
    type: "document",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 01-2-2V5a2 2 012-2h5.586a1 1 01.707.293l5.414 5.414a1 1 01.293.707V19a2 2 01-2 2z",
    color: "primary",
    content: "<h1>Document Title</h1><hr/><h2>Section 1</h2><p>Your content here...</p><h2>Section 2</h2><ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>",
  },
  {
    id: "document-thankyou",
    title: "Thank You / Follow-Up",
    description: "A post-interview thank you note template.",
    type: "document",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 01-2-2V5a2 2 012-2h5.586a1 1 01.707.293l5.414 5.414a1 1 01.293.707V19a2 2 01-2 2z",
    color: "teal",
    content: "<h2>Subject: Thank You — [Job Title] Interview</h2><hr/><p>Dear [Interviewer Name],</p><br/><p>Thank you so much for taking the time to meet with me today to discuss the <strong>[Job Title]</strong> role at <strong>[Company Name]</strong>. I really enjoyed learning more about the team and the exciting work you are doing.</p><br/><p>Best regards,<br/>Your Name</p>",
  },
];

const COLOR_MAP: Record<string, { bg: string; text: string; hover: string; gradient: string }> = {
  green: { bg: "bg-green-500/20", text: "text-green-400", hover: "hover:bg-green-500/30", gradient: "from-green-500 to-green-700" },
  blue: { bg: "bg-blue-500/20", text: "text-blue-400", hover: "hover:bg-blue-500/30", gradient: "from-blue-500 to-blue-700" },
  purple: { bg: "bg-purple-500/20", text: "text-purple-400", hover: "hover:bg-purple-500/30", gradient: "from-purple-500 to-purple-700" },
  indigo: { bg: "bg-indigo-500/20", text: "text-indigo-400", hover: "hover:bg-indigo-500/30", gradient: "from-indigo-500 to-indigo-700" },
  primary: { bg: "bg-primary-500/20", text: "text-primary-400", hover: "hover:bg-primary-500/30", gradient: "from-primary-500 to-primary-700" },
  teal: { bg: "bg-teal-500/20", text: "text-teal-400", hover: "hover:bg-teal-500/30", gradient: "from-teal-500 to-teal-700" },
};

export default function TemplatesPageClient({ user }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);

  const useTemplate = useCallback(async (template: Template) => {
    setCreating(true);
    const r = await createDocumentClient({
      title: template.title,
      content: template.content,
      type: template.type,
      status: "draft",
      tags: template.type,
    });
    if (r.success) {
      toast.success("Template applied! Opening document...");
      window.location.href = `/documents?id=${r.data.id}`;
    } else {
      toast.error(r.error || "Failed to create from template");
    }
    setCreating(false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 01-2 2H7a2 2 0 01-2-2m14 0V7a2 2 0 01-2-2H7a2 2 0 01-2 2v4" />
                </svg>
              </div>
              <span className="text-white font-semibold">Templates</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white">Dashboard</Link>
              <Link href="/notes" className="text-sm text-slate-300 hover:text-white">Notes</Link>
              <Link href="/documents" className="text-sm text-slate-300 hover:text-white">Documents</Link>
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm text-slate-400 hover:text-red-400">Sign Out</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">Document Templates</h1>
          <p className="text-slate-400 mt-1">Choose a template to quickly create resumes, cover letters, and more.</p>
        </div>

        {/* Template Cards */}
        <div className="grid grid-cols-12 gap-6">
          {TEMPLATES.map(tmpl => {
            const c = COLOR_MAP[tmpl.color] || COLOR_MAP.primary;
            return (
              <div key={tmpl.id}
                className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all group cursor-pointer"
                onClick={() => setSelectedTemplate(tmpl)}>
                <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <svg className={`w-5 h-5 ${c.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tmpl.icon} />
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-1">{tmpl.title}</h3>
                <p className="text-xs text-slate-400 mb-4 line-clamp-2">{tmpl.description}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${c.text} ${c.bg}`}>{tmpl.type === "coverLetter" ? "Cover Letter" : tmpl.type}</span>
                  <button onClick={(e) => { e.stopPropagation(); useTemplate(tmpl); }}
                    disabled={creating}
                    className={`ml-auto text-xs px-3 py-1.5 bg-gradient-to-r ${c.gradient} text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50`}>
                    Use Template
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Template Preview Modal */}
        {selectedTemplate && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTemplate(null)}>
            <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-slate-900 border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{selectedTemplate.title}</h3>
                <div className="flex gap-2">
                  <button onClick={() => { useTemplate(selectedTemplate); setSelectedTemplate(null); }}
                    disabled={creating}
                    className="px-4 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
                    {creating ? "Creating..." : "Use This Template"}
                  </button>
                  <button onClick={() => setSelectedTemplate(null)}
                    className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: selectedTemplate.content }} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
