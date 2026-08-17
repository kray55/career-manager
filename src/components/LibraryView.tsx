"use client";
import { useState, useMemo, useCallback } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
// Use client helpers to avoid bundling server-only prisma
import { deleteBookmarkClient, updateBookmarkClient } from "@/actions/bookmark.client";

interface Bookmark { id: string; url: string; title: string; description: string | null; favicon: string | null; emoji?: string | null; tags: string[]; isFavorite: boolean; createdAt: string; updatedAt: string }

interface Props { bookmarks: Bookmark[] }

export default function LibraryView({ bookmarks: initial }: Props) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initial);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newBookmark, setNewBookmark] = useState({ url: "", title: "", description: "", emoji: "🔖", tags: "" });
  const [isAdding, setIsAdding] = useState(false);

  const addBookmark = useCallback(async () => {
    if (!newBookmark.url || !newBookmark.title) { toast.error("Add a URL and title first"); return; }
    setIsAdding(true);
    try {
      const response = await fetch("/api/bookmarks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newBookmark, tags: newBookmark.tags.split(",").map((tag) => tag.trim()).filter(Boolean) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save bookmark");
      setBookmarks((current) => [data, ...current]);
      setNewBookmark({ url: "", title: "", description: "", emoji: "🔖", tags: "" });
      setShowAdd(false);
      toast.success("Bookmark saved");
    } catch (error: any) { toast.error(error.message || "Failed to save bookmark"); } finally { setIsAdding(false); }
  }, [newBookmark]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return bookmarks;
    const q = searchQuery.toLowerCase();
    return bookmarks.filter(b =>
      b.title.toLowerCase().includes(q) ||
      (b.description && b.description.toLowerCase().includes(q)) ||
      b.url.toLowerCase().includes(q) ||
      b.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [bookmarks, searchQuery]);

  const toggleFav = useCallback(async (bm: Bookmark) => {
    const r = await updateBookmarkClient(bm.id, { isFavorite: !bm.isFavorite });
    if (r.success) setBookmarks(prev => prev.map(b => b.id === bm.id ? { ...b, isFavorite: !b.isFavorite } : b));
    else toast.error("Failed");
  }, []);

  const del = useCallback(async (id: string) => {
    if (!confirm("Delete this bookmark?")) return;
    setIsDeleting(id);
    const r = await deleteBookmarkClient(id);
    if (r.success) { setBookmarks(p => p.filter(b => b.id !== id)); toast.success("Deleted"); }
    else toast.error("Failed");
    setIsDeleting(null);
  }, []);

  const getDomain = (url: string) => { try { return new URL(url).hostname } catch { return url } };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <span className="text-white font-semibold">Career Library</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white">Dashboard</Link>
              <Link href="/notes" className="text-sm text-slate-300 hover:text-white">Notes</Link>
              <Link href="/documents" className="text-sm text-slate-300 hover:text-white">Documents</Link>
              <Link href="/templates" className="text-sm text-slate-300 hover:text-white">Templates</Link>
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm text-slate-400 hover:text-red-400">Sign Out</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">My Bookmarks</h1>
            <p className="text-slate-400 text-sm mt-1">{bookmarks.length} bookmark{bookmarks.length !== 1 ? "s" : ""} saved</p>
          </div>
          <button onClick={() => setShowAdd((value) => !value)} className="rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white">{showAdd ? "Close form" : "+ Add bookmark"}</button>
        </div>

        {showAdd && <div className="mb-6 rounded-2xl border border-primary-400/20 bg-white/5 p-5 shadow-xl"><div className="mb-4 flex items-center gap-3"><span className="text-3xl">{newBookmark.emoji || "🔖"}</span><div><h2 className="font-semibold text-white">Add to your career library</h2><p className="text-xs text-slate-400">Use an emoji to identify the opportunity at a glance.</p></div></div><div className="grid gap-3 sm:grid-cols-2"><input value={newBookmark.url} onChange={(e) => setNewBookmark((value) => ({ ...value, url: e.target.value }))} placeholder="https://job-board.com/role" className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white" /><input value={newBookmark.title} onChange={(e) => setNewBookmark((value) => ({ ...value, title: e.target.value }))} placeholder="Opportunity title" className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white" /><input value={newBookmark.emoji} onChange={(e) => setNewBookmark((value) => ({ ...value, emoji: e.target.value.slice(0, 2) }))} placeholder="🔖" className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white" /><input value={newBookmark.tags} onChange={(e) => setNewBookmark((value) => ({ ...value, tags: e.target.value }))} placeholder="tags, comma separated" className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white" /></div><textarea value={newBookmark.description} onChange={(e) => setNewBookmark((value) => ({ ...value, description: e.target.value }))} placeholder="Why this opportunity matters" className="mt-3 min-h-20 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white" /><button disabled={isAdding} onClick={addBookmark} className="mt-3 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{isAdding ? "Saving..." : "Save bookmark"}</button></div>}

        <div className="relative mb-6">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search bookmarks by title, URL, or tags..."
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-20 h-20 text-slate-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <p className="text-slate-400 text-lg mb-2">{searchQuery ? "No bookmarks match your search" : "No bookmarks yet"}</p>
            <p className="text-slate-600 text-sm">{searchQuery ? "Try a different search term" : "Use the Firefox sidebar to save job listings"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-4">
            {filtered.map(bm => (
              <div key={bm.id} className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all group">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex min-w-0 flex-1 items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-xl">{bm.emoji || "🔖"}</span>
                  <div className="min-w-0 flex-1">
                    <a href={bm.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white hover:text-primary-400 transition-colors line-clamp-2 block">{bm.title}</a>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{getDomain(bm.url)}</p>
                  </div></div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => toggleFav(bm)} className={`p-1.5 rounded-lg transition-colors ${bm.isFavorite ? "text-yellow-400 hover:text-yellow-300 bg-yellow-500/10" : "text-slate-600 hover:text-yellow-400 hover:bg-yellow-500/10"}`}>
                      <svg className="w-4 h-4" fill={bm.isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                    <button onClick={() => del(bm.id)} disabled={isDeleting === bm.id} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50">
                      {isDeleting === bm.id
                        ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /></svg>
                        : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      }
                    </button>
                  </div>
                </div>
                {bm.description && <p className="text-xs text-slate-400 mb-3 line-clamp-2">{bm.description}</p>}
                <div className="flex items-center gap-2 flex-wrap">
                  <a href={bm.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-400 hover:text-primary-300 truncate max-w-[200px]">{bm.url}</a>
                  {bm.tags.length > 0 && <span className="text-xs text-slate-600">•</span>}
                  {bm.tags.slice(0, 3).map(t => <span key={t} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{t}</span>)}
                </div>
                <p className="text-xs text-slate-600 mt-2">Saved {new Date(bm.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
