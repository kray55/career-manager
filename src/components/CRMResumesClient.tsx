"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import toast from "react-hot-toast";
import ResumesList from "@/components/ResumesList";
import { createResume } from "@/actions/resumes";

interface Props {
  user: { name: string; email: string; role: string };
  resumes: any[];
}

export default function CRMResumesClient({ user, resumes: initialResumes }: Props) {
  const router = useRouter();
  const [resumes, setResumes] = useState(initialResumes);
  const [creating, setCreating] = useState(false);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    try {
      const resume = await createResume({ title: "Untitled Resume", content: "{}" });
      toast.success("Resume created");
      router.push(`/resumes?id=${resume.id}`);
    } catch {
      toast.error("Failed to create resume");
    } finally {
      setCreating(false);
    }
  }, [router]);

  const handleRefresh = useCallback(async () => {
    const res = await fetch("/api/resumes");
    if (res.ok) {
      const data = await res.json();
      setResumes(data);
    }
  }, []);

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
              <span className="text-white font-semibold">Resume Builder</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white">Dashboard</Link>
              <Link href="/notes" className="text-sm text-slate-300 hover:text-white">Notes</Link>
              <Link href="/documents" className="text-sm text-slate-300 hover:text-white">Documents</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Resumes</h1>
            <p className="text-sm text-slate-400 mt-1">Build and manage your professional resumes</p>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-700 text-white text-sm font-medium rounded-xl hover:from-purple-600 hover:to-purple-800 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {creating ? "Creating..." : "New Resume"}
          </button>
        </div>

        {/* Resumes List */}
        <ResumesList resumes={resumes} onRefresh={handleRefresh} />
      </main>
    </div>
  );
}
