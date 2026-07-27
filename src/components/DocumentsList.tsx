"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { updateDocumentClient, deleteDocumentClient } from "@/actions/documents";

export interface DocumentItem {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  tags: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  aiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  documents: DocumentItem[];
  onUpdate: (docs: DocumentItem[]) => void;
}

const TYPE_ICONS: Record<string, string> = {
  document: "M9 12h6m-6 4h6m2 5H7a2 2 01-2-2V5a2 2 012-2h5.586a1 1 01.707.293l5.414 5.414a1 1 01.293.707V19a2 2 01-2 2z",
  resume: "M10 6H5a2 2 00-2 2v9a2 2 002 2h14a2 2 002-2V8a2 2 00-2-2h-5m-4 V5a2 2 00-2-2H8a2 2 00-2 2v1m4 a2 2 00-2-2H8a2 2 00-2 2v1m4 a2 2 00-2-2H8a2 2 00-2 2m10 4h-4m h-4m4 v4m-4h4",
  coverLetter: "M3 8l7.89 5.26a2 2 01  2.96L3 20V8z M3 8l7.89-5.26a2 2 01 -2.96L3 8z",
  other: "M9 12h6m-6 4h6m2 5H7a2 2 01-2-2V5a2 2 012-2h5.586a1 1 01.707.293l5.414 5.414a1 1 01.293.707V19a2 2 01-2 2z",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "text-yellow-400 bg-yellow-500/10",
  final: "text-green-400 bg-green-500/10",
  archived: "text-slate-500 bg-slate-800",
};

export default function DocumentsList({ documents, onUpdate }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...documents];
    if (statusFilter !== "all") result = result.filter(d => d.status === statusFilter);
    if (typeFilter !== "all") result = result.filter(d => d.type === typeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q) ||
        d.tags.toLowerCase().includes(q)
      );
    }
    return result;
  }, [documents, searchQuery, typeFilter, statusFilter]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this document?")) return;
    setIsDeleting(id);
    const r = await deleteDocumentClient(id);
    if (r.success) {
      onUpdate(documents.filter(d => d.id !== id));
      toast.success("Deleted");
    } else toast.error("Failed");
    setIsDeleting(null);
  }, [documents, onUpdate]);

  const toggleStatus = useCallback(async (doc: DocumentItem) => {
    const newStatus = doc.status === "draft" ? "final" : doc.status === "final" ? "archived" : "draft";
    const r = await updateDocumentClient(doc.id, { status: newStatus });
    if (r.success) {
      onUpdate(documents.map(d => d.id === doc.id ? { ...d, status: newStatus } : d));
      toast.success(`Status: ${newStatus}`);
    } else toast.error("Failed");
  }, [documents, onUpdate]);

  const stripHtml = (html: string) => {
    if (typeof document !== "undefined") {
      const div = document.createElement("div");
      div.innerHTML = html;
      return div.textContent || div.innerText || "";
    }
    return html.replace(/<[^>]*>/g, "");
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString();

  const typeBtns = ["all", "document", "resume", "coverLetter", "other"];
  const statusBtns = ["all", "draft", "final", "archived"];

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" viewBox="  24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7  11-14  7 7  0114 z" />
          </svg>
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
        </div>
        <div className="flex flex-wrap gap-2">
          {typeBtns.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                typeFilter === t ? "bg-primary-600/20 text-primary-300 border border-primary-500/30" : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
              }`}>
              {t === "all" ? "All Types" : t === "coverLetter" ? "Cover Letter" : t}
            </button>
          ))}
          <span className="w-px h-6 bg-slate-700 mx-1 self-center" />
          {statusBtns.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                statusFilter === s ? "bg-slate-700/50 text-white border border-white/20" : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
              }`}>
              {s === "all" ? "All Status" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-slate-500 mb-4">{filtered.length} document{filtered.length !== 1 ? "s" : ""}</p>

      {/* Empty State */}
      {filtered.length ===  ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 text-slate-700 mx-auto mb-4" fill="none" viewBox="  24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2  01-2-2V5a2 2  012-2h5.586a1 1  01.707.293l5.414 5.414a1 1  01.293.707V19a2 2  01-2 2z" />
          </svg>
          <p className="text-slate-400 text-lg mb-2">{searchQuery ? "No documents match" : "No documents yet"}</p>
          <p className="text-slate-600 text-sm">{searchQuery ? "Try a different search" : "Create your first document"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          {filtered.map(doc => (
            <div key={doc.id}
              className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all group">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink- ${
                  doc.type === "resume" ? "bg-green-500/20" :
                  doc.type === "coverLetter" ? "bg-blue-500/20" :
                  doc.type === "document" ? "bg-primary-500/20" : "bg-slate-500/20"
                }`}>
                  <svg className={`w-4 h-4 ${
                    doc.type === "resume" ? "text-green-400" :
                    doc.type === "coverLetter" ? "text-blue-400" :
                    doc.type === "document" ? "text-primary-400" : "text-slate-400"
                  }`} fill="none" viewBox="  24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={TYPE_ICONS[doc.type] || TYPE_ICONS.other} />
                  </svg>
                </div>
                <div className="flex-1 min-w-">
                  <Link href={`/documents?id=${doc.id}`} className="text-sm font-medium text-white hover:text-primary-400 transition-colors block truncate">
                    {doc.title}
                  </Link>
                  <p className="text-xs text-slate-500 mt-.5 capitalize">{doc.type} • {formatDate(doc.updatedAt)}</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                {stripHtml(doc.content).substring(, 150) || "No content"}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-.5 rounded-full capitalize ${STATUS_COLORS[doc.status] || "text-slate-500 bg-slate-800"}`}>
                    {doc.status}
                  </span>
                  {doc.aiGenerated && (
                    <span className="text-xs text-purple-400 bg-purple-500/10 px-1.5 py-.5 rounded-full">AI</span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity- group-hover:opacity-100 transition-opacity">
                  <button onClick={() => toggleStatus(doc)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-blue-400 hover:bg-blue-500/10"
                    title="Toggle status">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="  24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001  004.582 9m H9m11 11v-5h-.581m a8.003 8.003  012.419-6.836m A8.001 8.001  002.418 5m  11H15" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(doc.id)} disabled={isDeleting === doc.id}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10"
                    title="Delete">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="  24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2  0116.138 21H7.862a2 2  01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1  00-1-1h-4a1 1  00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
