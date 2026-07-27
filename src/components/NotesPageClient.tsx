"use client";

import { useState, useCallback } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import NotesList, { NoteItem } from "@/components/NotesList";
import NoteEditor from "@/components/NoteEditor";
import { createNoteClient, updateNoteClient } from "@/actions/notes";

interface Props {
  user: { name: string; email: string; role: string; tenantSlug: string };
  initialNotes: NoteItem[];
}

export default function NotesPageClient({ user, initialNotes }: Props) {
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [showNewNote, setShowNewNote] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving">("idle");

  // New note state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newJobUrl, setNewJobUrl] = useState("");

  // Get note ID from URL for direct access
  const [selectedId] = useState(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      return sp.get("id");
    }
    return null;
  });

  const selectedNote = selectedId ? notes.find(n => n.id === selectedId) || null : null;

  const handleCreate = useCallback(async () => {
    if (!newTitle.trim()) { toast.error("Title is required"); return; }
    setSaveStatus("saving");
    const r = await createNoteClient({
      title: newTitle.trim(),
      content: newContent,
      tags: newTags.split(",").map(t => t.trim()).filter(Boolean),
      jobUrl: newJobUrl.trim() || null,
    });
    if (r.success) {
      const newNote: NoteItem = {
        id: r.data.id,
        title: r.data.title,
        content: r.data.content,
        tags: r.data.tags || [],
        jobUrl: r.data.jobUrl || null,
        pinned: false,
        archived: false,
        createdAt: r.data.createdAt,
        updatedAt: r.data.updatedAt,
      };
      setNotes(prev => [newNote, ...prev]);
      setNewTitle("");
      setNewContent("");
      setNewTags("");
      setNewJobUrl("");
      setShowNewNote(false);
      toast.success("Note created!");
    } else toast.error(r.error || "Failed to create note");
    setSaveStatus("idle");
  }, [newTitle, newContent, newTags, newJobUrl]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingNote) return;
    setSaveStatus("saving");
    const r = await updateNoteClient(editingNote.id, {
      title: editingNote.title,
      content: editingNote.content,
      tags: typeof editingNote.tags === "string" ? (editingNote.tags as any).split(",").map((t: string) => t.trim()).filter(Boolean) : editingNote.tags,
      jobUrl: editingNote.jobUrl,
    });
    if (r.success) {
      setNotes(prev => prev.map(n => n.id === editingNote.id ? { ...editingNote } : n));
      toast.success("Note saved!");
      setEditingNote(null);
    } else toast.error(r.error || "Failed to save");
    setSaveStatus("idle");
  }, [editingNote]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Nav */}
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="  24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2  00-2 2v11a2 2  002 2h11a2 2  002-2v-5m-1.414-9.414a2 2  112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <span className="text-white font-semibold">My Notes</span>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-.5 rounded-full">{user.tenantSlug}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white">Dashboard</Link>
              <Link href="/library" className="text-sm text-slate-300 hover:text-white">Library</Link>
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm text-slate-400 hover:text-red-400">Sign Out</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">My Notes</h1>
            <p className="text-slate-400 text-sm mt-1">{notes.length} note{notes.length !== 1 ? "s" : ""} saved</p>
          </div>
          <div className="flex gap-2">
            {!showNewNote && !editingNote && (
              <button onClick={() => setShowNewNote(true)}
                className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white text-sm font-medium rounded-xl flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Note
              </button>
            )}
          </div>
        </div>

        {/* Selected Note View */}
        {selectedNote && !editingNote && (
          <div className="mb-8 bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">{selectedNote.title}</h2>
              <div className="flex gap-2">
                <button onClick={() => setEditingNote({ ...selectedNote })}
                  className="px-3 py-1.5 bg-primary-600/20 text-primary-300 text-sm rounded-lg hover:bg-primary-600/30">
                  Edit
                </button>
                <Link href="/notes" className="px-3 py-1.5 bg-slate-800 text-slate-400 text-sm rounded-lg hover:text-white">
                  Back
                </Link>
              </div>
            </div>
            <div className="prose prose-invert max-w-none text-slate-300" dangerouslySetInnerHTML={{ __html: selectedNote.content }} />
            {selectedNote.tags.length >  && (
              <div className="flex gap-2 mt-4">
                {selectedNote.tags.map(t => <span key={t} className="text-xs bg-slate-800 text-slate-400 px-2 py-.5 rounded-full">{t}</span>)}
              </div>
            )}
            {selectedNote.jobUrl && (
              <a href={selectedNote.jobUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-400 hover:text-primary-300 mt-2 inline-block">
                🔗 {selectedNote.jobUrl}
              </a>
            )}
          </div>
        )}

        {/* New Note Form */}
        {showNewNote && (
          <div className="mb-8 bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Note</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Title</label>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="Note title..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Content</label>
                <NoteEditor initialContent={newContent} onChange={setNewContent} minHeight="200px" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">Tags (comma separated)</label>
                  <input type="text" value={newTags} onChange={e => setNewTags(e.target.value)}
                    placeholder="career, interview, research"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">Job URL (optional)</label>
                  <input type="url" value={newJobUrl} onChange={e => setNewJobUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreate} disabled={saveStatus === "saving" || !newTitle.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center gap-2">
                  {saveStatus === "saving" ? <svg className="animate-spin h-4 w-4" viewBox="  24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8  018-8VC5.373   5.373  12h4zm2 5.291A7.962 7.962  014 12Hc 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> : null}
                  {saveStatus === "saving" ? "Creating..." : "Create Note"}
                </button>
                <button onClick={() => { setShowNewNote(false); setNewTitle(""); setNewContent(""); setNewTags(""); setNewJobUrl(""); }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-sm rounded-lg hover:text-white">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Note Form */}
        {editingNote && (
          <div className="mb-8 bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Note</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Title</label>
                <input type="text" value={editingNote.title} onChange={e => setEditingNote({ ...editingNote, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Content</label>
                <NoteEditor initialContent={editingNote.content} onChange={(html) => setEditingNote({ ...editingNote, content: html })} minHeight="300px" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveEdit} disabled={saveStatus === "saving" || !editingNote.title.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
                  {saveStatus === "saving" ? "Saving..." : "Save Changes"}
                </button>
                <button onClick={() => setEditingNote(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-sm rounded-lg hover:text-white">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notes List */}
        {!selectedNote && !showNewNote && !editingNote && (
          <NotesList notes={notes} onUpdate={setNotes} viewMode="list" />
        )}
      </main>
    </div>
  );
}
