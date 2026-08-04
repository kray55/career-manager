"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import toast from "react-hot-toast";
import ResumeBuilder from "@/components/ResumeBuilder";
import { updateResume, exportResumeToPDF, getResumeById } from "@/actions/resumes";

interface Props {
  user: { name: string; email: string; role: string };
  resume: { id: string; title: string; content: string; version: number } | null;
}

export default function ResumeEditorClient({ user, resume: initialResume }: Props) {
  const router = useRouter();
  const [resume, setResume] = useState(initialResume);
  const [exporting, setExporting] = useState(false);

  const initialData = resume?.content ? (() => {
    try { return JSON.parse(resume.content); } catch { return undefined; }
  })() : undefined;

  const handleSave = useCallback(async (data: any) => {
    const content = JSON.stringify(data);
    if (resume?.id) {
      const updated = await updateResume({ id: resume.id, content });
      setResume((prev) => prev ? { ...prev, content, version: updated.version } : prev);
    } else {
      const { createResume } = await import("@/actions/resumes");
      const created = await createResume({ title: "Untitled Resume", content });
      setResume({ id: created.id, title: created.title, content, version: created.version });
      router.replace(`/resumes?id=${created.id}`, undefined, { shallow: true });
    }
  }, [resume, router]);

  const handleExport = useCallback(async () => {
    if (!resume?.id) {
      toast.error("Save the resume first before exporting");
      return;
    }
    setExporting(true);
    try {
      const result = await exportResumeToPDF(resume.id);
      // Open in new tab for print-to-PDF
      const blob = new Blob([result.html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank");
      if (w) {
        w.document.title = result.title;
        // Trigger print dialog for PDF save
        w.onload = () => { w.print(); };
      }
      URL.revokeObjectURL(url);
      toast.success("Export ready");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }, [resume]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Nav */}
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-white font-semibold">
                {resume?.title || "New Resume"}
                <span className="text-xs text-slate-500 ml-2">v{resume?.version || 1}</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/crm-resumes" className="text-sm text-slate-300 hover:text-white">Back to List</Link>
              <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white">Dashboard</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ResumeBuilder
          initialData={initialData}
          onSave={handleSave}
          onExport={handleExport}
          exporting={exporting}
        />
      </main>
    </div>
  );
}
