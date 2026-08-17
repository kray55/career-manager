import { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface Bookmark { id: string; url: string; title: string; description: string | null; favicon: string | null; createdAt: string }

const links = [
  ["/dashboard", "Overview", "See your career command center"],
  ["/library", "Library & bookmarks", "Keep every opportunity within reach"],
  ["/notes", "Notes & documents", "Turn research into action"],
  ["/crm-resumes", "Resume manager", "Tailor your story for every role"],
  ["/crm-contacts", "Contacts & CRM", "Build momentum with your network"],
  ["/store", "Career store", "Discover tools for your next move"],
] as const;

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
      if (res.ok) setBookmarks((await res.json()).bookmarks || []);
    } catch { /* network errors are surfaced by the next explicit action */ }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { if (isOpen) fetchBookmarks(); }, [isOpen, fetchBookmarks]);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setIsOpen(false); };
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (panelRef.current && !panelRef.current.contains(target) && !target.closest("#sidebar-toggle")) setIsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("click", onClick); };
  }, [isOpen]);

  const handleSave = useCallback(async () => {
    if (!url.trim() || !title.trim()) { toast.error("Add a URL and title to save this opportunity."); return; }
    setIsSaving(true);
    try {
      const res = await fetch("/api/bookmarks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, title, description: "" }) });
      if (!res.ok) throw new Error("save failed");
      toast.success("Saved to your career library");
      setUrl(""); setTitle(""); fetchBookmarks();
    } catch { toast.error("We could not save that bookmark. Please try again."); }
    finally { setIsSaving(false); }
  }, [url, title, fetchBookmarks]);

  if (!session) return null;

  return (
    <>
      <button id="sidebar-toggle" type="button" aria-label={isOpen ? "Close career navigation" : "Open career navigation"} aria-expanded={isOpen} onClick={() => setIsOpen(value => !value)} className="fixed right-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-slate-900/75 text-white shadow-xl backdrop-blur-xl transition hover:bg-indigo-500/80">
        {isOpen ? <span className="text-xl leading-none">×</span> : <span className="flex flex-col gap-1"><span className="h-0.5 w-5 bg-current" /><span className="h-0.5 w-5 bg-current" /><span className="h-0.5 w-5 bg-current" /></span>}
      </button>

      <div className={`fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-200 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={!isOpen} />
      <aside ref={panelRef} aria-label="Career Manager navigation" className={`fixed right-0 top-0 z-[55] flex h-full w-[min(92vw,25rem)] flex-col border-l border-white/10 bg-[#0b1228]/95 shadow-2xl backdrop-blur-2xl transition-transform duration-200 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="border-b border-white/10 px-6 pb-5 pt-6">
          <p className="cm-eyebrow">Career command center</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Move your next opportunity forward.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Save job leads, shape your story, and keep your momentum in one calm workspace.</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <nav aria-label="Primary navigation" className="space-y-1 bg-transparent shadow-none">
            {links.map(([href, label, description]) => <a key={href} href={href} onClick={() => setIsOpen(false)} className="group block rounded-2xl px-3 py-3 hover:bg-white/10"><span className="block text-sm font-medium text-slate-100 group-hover:text-white">{label}</span><span className="mt-0.5 block text-xs text-slate-500 group-hover:text-slate-300">{description}</span></a>)}
          </nav>

          <div className="cm-glass mt-6 rounded-2xl p-4">
            <p className="text-sm font-semibold text-white">Save a job lead</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">Capture a role while it is fresh. The Firefox sidebar can send opportunities here for persistent search.</p>
            <div className="mt-4 space-y-3">
              <input aria-label="Job or resource URL" type="url" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://job-board.com/role" className="w-full px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-400" />
              <input aria-label="Job or resource title" type="text" value={title} onChange={event => setTitle(event.target.value)} placeholder="Senior product role at Acme" className="w-full px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-400" />
              <button type="button" onClick={handleSave} disabled={isSaving || !url || !title} className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? "Saving…" : "Save to career library"}</button>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between"><p className="cm-eyebrow">Recent saves</p><a href="/library" onClick={() => setIsOpen(false)} className="text-xs text-cyan-300 hover:text-white">View all</a></div>
            <div className="mt-3 space-y-2">
              {isLoading ? <div className="h-16 animate-pulse rounded-2xl bg-white/5" /> : bookmarks.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm leading-6 text-slate-500">Your saved roles and research links will appear here.</p> : bookmarks.map(bookmark => <a key={bookmark.id} href={bookmark.url} target="_blank" rel="noopener noreferrer" className="block rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 hover:bg-white/[.09]"><p className="truncate text-sm font-medium text-white">{bookmark.title}</p><p className="mt-1 truncate text-xs text-slate-500">{bookmark.url.replace(/^https?:\/\//, "")}</p></a>)}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
