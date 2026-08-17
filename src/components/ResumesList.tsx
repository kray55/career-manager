"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
// Use client helpers to avoid bundling server-only prisma
import { deleteResumeClient, restoreResumeVersionClient } from "@/actions/resumes.client";

interface ResumeHistorySummary {
  version: number;
  createdAt: string;
}

interface ResumeItem {
  id: string;
  title: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  history: ResumeHistorySummary[];
}

interface ResumesListProps {
  resumes: ResumeItem[];
  onRefresh: () => void;
}

export default function ResumesList({ resumes, onRefresh }: ResumesListProps) {
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return resumes;
    const q = search.toLowerCase();
    return resumes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
    );
  }, [resumes, search]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Delete this resume and all its version history?")) return;
      setLoadingId(id);
      try {
        await deleteResumeClient(id);
        toast.success("Resume deleted");
        onRefresh();
      } catch {
        toast.error("Failed to delete resume");
      } finally {
        setLoadingId(null);
      }
    },
    [onRefresh]
  );

  const handleRestore = useCallback(
    async (resumeId: string, version: number) => {
      if (!confirm(`Restore to version ${version}? This will create a new version.`))
        return;
      setLoadingId(resumeId);
      try {
        await restoreResumeVersionClient(resumeId, version);
        toast.success(`Restored to version ${version}`);
        onRefresh();
      } catch {
        toast.error("Failed to restore version");
      } finally {
        setLoadingId(null);
      }
    },
    [onRefresh]
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search resumes..."
          className="w-full bg-slate-800/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium mb-1">No resumes found</p>
          <p className="text-sm">{search ? "Try a different search term." : "Create your first resume to get started."}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Title</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Version</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">History</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Updated</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((resume) => (
                <tr
                  key={resume.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4">
                    <Link
                      href={`/resumes?id=${resume.id}`}
                      className="text-white font-medium hover:text-primary-300 transition-colors"
                    >
                      {resume.title}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-slate-300">v{resume.version}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {resume.history.slice(0, 5).map((h) => (
                        <button
                          key={h.version}
                          onClick={() => handleRestore(resume.id, h.version)}
                          disabled={loadingId === resume.id}
                          className="px-2 py-0.5 text-xs bg-slate-700/50 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-50"
                          title={`Restore v${h.version} (${new Date(h.createdAt).toLocaleDateString()})`}
                        >
                          v{h.version}
                        </button>
                      ))}
                      {resume.history.length > 5 && (
                        <span className="px-2 py-0.5 text-xs text-slate-500">
                          +{resume.history.length - 5} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">
                    {new Date(resume.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/resumes?id=${resume.id}`}
                        className="px-3 py-1.5 text-xs bg-primary-500/20 text-primary-300 rounded-lg hover:bg-primary-500/30"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(resume.id)}
                        disabled={loadingId === resume.id}
                        className="px-3 py-1.5 text-xs bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
