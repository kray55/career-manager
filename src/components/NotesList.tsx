"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
// Use client helper to avoid bundling server-only prisma
import { updateNoteClient, deleteNoteClient } from "@/actions/notes.client";

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  jobUrl: string | null;
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  notes: NoteItem[];
  onUpdate: (notes: NoteItem[]) => void;
  viewMode?: "list" | "grid";
}

export default function NotesList({ notes, onUpdate, viewMode = "list" }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pinned" | "archived">("all");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [mode, setMode] = useState<"list" | "grid">(viewMode);

  const filtered = useMemo(() => {
    let result = [...notes];
    if (filter === "pinned") result = result.filter(n => n.pinned);
    else if (filter === "archived") result = result.filter(n => n.archived);
    else result = result.filter(n => !n.archived);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [notes, searchQuery, filter]);

  const togglePin = useCallback(async (note: NoteItem) => {
    const r = await updateNoteClient(note.id, { pinned: !note.pinned });
    if (r.success) {
      onUpdate(notes.map(n => n.id === note.id ? { ...n, pinned: !n.pinned } : n));
      toast.success(note.pinned ? "Unpinned" : "Pinned");
    } else toast.error("Failed");
  }, [notes, onUpdate]);

  const toggleArchive = useCallback(async (note: NoteItem) => {
    const r = await updateNoteClient(note.id, { archived: !note.archived });
    if (r.success) {
      onUpdate(notes.map(n => n.id === note.id ? { ...n, archived: !n.archived } : n));
      toast.success(note.archived ? "Restored" : "Archived");
    } else toast.error("Failed");
  }, [notes, onUpdate]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this note permanently?")) return;
    setIsDeleting(id);
    const r = await deleteNoteClient(id);
    if (r.success) {
      onUpdate(notes.filter(n => n.id !== id));
      toast.success("Deleted");
    } else toast.error("Failed");
    setIsDeleting(null);
  }, [notes, onUpdate]);

  const stripHtml = (html: string) => {
    if (typeof document !== "undefined") {
      const div = document.createElement("div");
      div.innerHTML = html;
      return div.textContent || div.innerText || "";
    }
    return html.replace(/<[^>]*>/g, "");
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  const filterBtns: { key: "all" | "pinned" | "archived"; label: string }[] = [
    { key: "all", label: "Active" },
    { key: "pinned", label: "Pinned" },
    { key: "archived", label: "Archived" },
  ];

  return (
    <div>
      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search notes by title, content, or tags..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {filterBtns.map(btn => (
            <button key={btn.key} onClick={() => setFilter(btn.key)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filter === btn.key ? "bg-primary-600/20 text-primary-300 border border-primary-500/30" : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
              }`}>
              {btn.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMode("list")}
            className={`p-2 rounded-lg transition-colors ${mode === "list" ? "bg-primary-600/20 text-primary-300" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
            title="List view">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <button onClick={() => setMode("grid")}
            className={`p-2 rounded-lg transition-colors ${mode === "grid" ? "bg-primary-600/20 text-primary-300" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
            title="Grid view">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z" /></svg>
          </button>
        </div>
      </div>

      {/* Notes Count */}
      <p className="text-xs text-slate-500 mb-4">
        {filtered.length} note{filtered.length !== 1 ? "s" : ""}
        {filter === "pinned" ? " (pinned)" : filter === "archived" ? " (archived)" : ""}
      </p>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-20 h-20 text-slate-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <p className="text-slate-400 text-lg mb-2">
            {searchQuery ? "No notes match your search" : filter === "archived" ? "No archived notes" : "No notes yet"}
          </p>
          <p className="text-slate-600 text-sm">
            {searchQuery ? "Try a different search term" : "Create your first note to get started"}
          </p>
        </div>
      ) : mode === "list" ? (
        <div className="space-y-2">
          {filtered.map(note => (
            <div key={note.id}
              className="group flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {note.pinned && (
                    <svg className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                    </svg>
                  )}
                  <Link href={`/notes?id=${note.id}`} className="text-sm font-medium text-white hover:text-primary-400 transition-colors truncate block">
                    {note.title || "Untitled Note"}
                  </Link>
                  {note.archived && (
                    <span className="text-xs bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">Archived</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 line-clamp-1 mb-1">
                  {stripHtml(note.content).substring(0, 120) || "No content"}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-600">{formatDate(note.updatedAt)}</span>
                  {note.tags.slice(0, 3).map(t => (
                    <span key={t} className="text-xs bg-slate-800/50 text-slate-500 px-1.5 py-0.5 rounded-full">{t}</span>
                  ))}
                  {note.jobUrl && (
                    <a href={note.jobUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-500 hover:text-primary-400 truncate max-w-[150px]">
                      {note.jobUrl.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={() => togglePin(note)}
                  className={`p-1.5 rounded-lg transition-colors ${note.pinned ? "text-yellow-400 hover:text-yellow-300" : "text-slate-600 hover:text-yellow-400 hover:bg-yellow-500/10"}`}
                  title={note.pinned ? "Unpin" : "Pin"}>
                  <svg className="w-4 h-4" fill={note.pinned ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                  </svg>
                </button>
                <button onClick={() => toggleArchive(note)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-blue-400 hover:bg-blue-500/10"
                  title={note.archived ? "Restore" : "Archive"}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </button>
                <button onClick={() => handleDelete(note.id)} disabled={isDeleting === note.id}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10"
                  title="Delete">
                  {isDeleting === note.id ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          {filtered.map(note => (
            <div key={note.id}
              className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all group">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {note.pinned && <svg className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" /></svg>}
                  <Link href={`/notes?id=${note.id}`} className="text-sm font-medium text-white hover:text-primary-400 transition-colors truncate block">{note.title || "Untitled Note"}</Link>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => togglePin(note)} className={`p-1 rounded-lg ${note.pinned ? "text-yellow-400" : "text-slate-600 hover:text-yellow-400"}`}>
                    <svg className="w-3.5 h-3.5" fill={note.pinned ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" /></svg>
                  </button>
                  <button onClick={() => handleDelete(note.id)} disabled={isDeleting === note.id} className="p-1 rounded-lg text-slate-600 hover:text-red-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400 line-clamp-3 mb-3">{stripHtml(note.content).substring(0, 200) || "No content"}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {note.tags.slice(0, 2).map(t => <span key={t} className="text-xs bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">{t}</span>)}
                <span className="text-xs text-slate-600 ml-auto">{formatDate(note.updatedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
