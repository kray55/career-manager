"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface Bookmark { id: string; url: string; title: string; description: string | null; favicon: string | null; createdAt: string }

/**
 * T3-B: SidebarRail - Floating sliding panel
 * Provides quick-access bookmark search and save capability
 * toggled via a floating button on the right edge.
 */
export default function SidebarRail() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchBookmarks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bookmarks?limit=5");
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data.bookmarks || []);
      }
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    if (isOpen) fetchBookmarks();
  }, [isOpen, fetchBookmarks]);

  // Close on escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && !(e.target as HTMLElement)?.closest?.("#sidebar-toggle")) {
        setIsOpen(false);
      }
    };
    if (isOpen) setTimeout(() => document.addEventListener("click", handleClick), 0);
    return () => document.removeEventListener("click", handleClick);
  }, [isOpen]);

  const handleSave = useCallback(async () => {
    if (!url || !title) { toast.error("URL and title are required"); return; }
    setIsSaving(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, title, description: "" }),
      });
      if (res.ok) {
        toast.success("Bookmark saved! 📑");
        setUrl("");
        setTitle("");
        fetchBookmarks();
      } else { toast.error("Failed to save"); }
    } catch { toast.error("Network error"); }
    finally { setIsSaving(false); }
  }, [url, title, fetchBookmarks]);

  if (!session) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        id="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 w-10 h-20 rounded-l-xl flex items-center justify-center shadow-lg transition-all ${
          isOpen ? "bg-primary-600 text-white right-[420px]" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
        }`}
        title={isOpen ? "Close sidebar" : "Open bookmark sidebar"}
      >
        <svg className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Sidebar Panel */}
      <div
        ref={panelRef}
        className={`fixed right-0 top-0 h-full z-40 w-[400px] bg-slate-900 border-l border-white/10 shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <h3 className="text-white font-semibold text-sm">Quick Save</h3>
              <p className="text-xs text-slate-500">Career Library Sidebar</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Quick Save Form */}
          <div className="p-5 border-b border-white/10">
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">URL</label>
                <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/job-posting"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Software Engineer at Acme Corp"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <button onClick={handleSave} disabled={isSaving || !url || !title}
                className="w-full py-2 bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {isSaving ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> : null}
                {isSaving ? "Saving..." : "Save Bookmark"}
              </button>
            </div>
          </div>

          {/* Recent Bookmarks */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Navigation Links */}
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Quick Nav</h4>
            <div className="space-y-1 mb-6">
              <a href="/notes" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2  00-2 2v11a2 2  002 2h11a2 2  002-2v-5m-1.414-9.414a2 2  112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Notes
              </a>
              <a href="/documents" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2  01-2-2V5a2 2  012-2h5.586a1 1  01.707.293l5.414 5.414a1 1  01.293.707V19a2 2  01-2 2z" /></svg>
                Documents
              </a>
              <a href="/templates" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 a2 2  01-2 2H7a2 2  01-2-2m14 V7a2 2  01-2-2H7a2 2  01-2 2v4" /></svg>
                Templates
              </a>
              <a href="/crm-resumes" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2  01-2-2V5a2 2  012-2h5.586a1 1  01.707.293l5.414 5.414a1 1  01.293.707V19a2 2  01-2 2z" /></svg>
                Resumes
              </a>
              <a href="/contact" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2  014.22 l7.89-5.26M5 19h14a2 2  002-2V7a2 2  00-2-2H5a2 2  00-2 2v10a2 2  002 2z" /></svg>
                Contact / Email
              </a>
              <a href="/crm-contacts" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4  11-8  4 4  018  7zM12 14a7 7  00-7 7h14a7 7  00-7-7z" /></svg>
                CRM Contacts
              </a>
              <a href="/store" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4  00-8 v4M5 9h14l1 12H4L5 9z" /></svg>
                Store
              </a>
              <button onClick={() => {}} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors w-full text-left">
                <svg className="w-4 h-4" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2  00-2 2v3l4-1.5V17h2a2 2  012 2v3l4-1.5V19a2 2  00-2-2h-2a2 2  01-2-2V8h12V5a2 2  00-2-2H7a2 2  00-2 2v8h12" /></svg>
                Team Chat (bottom-right)
              </button>
            </div>
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Recent Bookmarks</h4>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-white/5 rounded-lg h-16" />)}
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-slate-700 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                <p className="text-slate-500 text-sm">No bookmarks yet</p>
                <p className="text-slate-600 text-xs mt-1">Save your first career resource above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bookmarks.map(bm => (
                  <a key={bm.id} href={bm.url} target="_blank" rel="noopener noreferrer"
                    className="block p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-colors group">
                    <p className="text-sm text-white font-medium truncate">{bm.title}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{bm.url.replace(/^https?:\/\//, "")}</p>
                    <p className="text-xs text-slate-600 mt-1">{new Date(bm.createdAt).toLocaleDateString()}</p>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
