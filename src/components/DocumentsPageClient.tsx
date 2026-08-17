"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import DocumentsList, { DocumentItem } from "@/components/DocumentsList";
import FileUploader from "@/components/FileUploader";
import NoteEditor from "@/components/NoteEditor";
// Use client-side helpers to avoid bundling server-only prisma into the browser
import { createDocumentClient, updateDocumentClient } from "@/actions/documents.client";

interface Props {
  user: { name: string; email: string; role: string; tenantSlug: string };
  initialDocuments: DocumentItem[];
}

export default function DocumentsPageClient({ user, initialDocuments }: Props) {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving">("idle");
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<Array<{ id: string; name: string; dataUrl: string; width: number; height: number }>>([]);
  const [localImage, setLocalImage] = useState<{ name: string; dataUrl: string; width: number; height: number } | null>(null);
  const localImageInput = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    const id = typeof router.query.id === "string" ? router.query.id : "";
    if (!id || editingDoc?.id === id) return;
    const selected = documents.find((document) => document.id === id);
    if (selected) setEditingDoc(selected);
  }, [router.query.id, documents, editingDoc?.id]);

  const openGallery = useCallback(async () => {
    const response = await fetch("/api/images");
    if (response.ok) { setGalleryImages((await response.json()).images || []); setShowGallery(true); }
    else toast.error("Unable to load Image Gallery");
  }, []);

  const handleLocalImage = useCallback((file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Choose a valid image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Images must be smaller than 10MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const image = new Image();
      image.onload = () => setLocalImage({ name: file.name.replace(/\\.[^/.]+$/, ""), dataUrl, width: image.naturalWidth, height: image.naturalHeight });
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, []);

  const saveLocalToGallery = useCallback(async () => {
    if (!localImage) return;
    const response = await fetch("/api/images", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: localImage.name, dataUrl: localImage.dataUrl, mimeType: "image/jpeg", width: localImage.width, height: localImage.height }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { toast.error(result.error || "Could not save image"); return; }
    setGalleryImages((current) => [result.image, ...current]);
    toast.success("Image saved to Image Gallery");
  }, [localImage]);

  const insertGalleryImage = useCallback((image: { dataUrl: string; name: string }) => {
    if (!editorRef.current) { toast.error("Click inside the document editor first"); return; }
    editorRef.current.chain().focus().setImage({ src: image.dataUrl, alt: image.name }).run();
    setEditingDoc((current) => current ? { ...current, content: editorRef.current.getHTML() } : current);
    setShowGallery(false);
    toast.success("Image inserted into document");
  }, []);

  // New doc state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<string>("document");
  const [newStatus, setNewStatus] = useState<string>("draft");
  const [newTags, setNewTags] = useState("");

  const handleCreate = useCallback(async () => {
    if (!newTitle.trim()) { toast.error("Title is required"); return; }
    setSaveStatus("saving");
    const r = await createDocumentClient({
      title: newTitle.trim(),
      content: newContent,
      type: newType,
      status: newStatus,
      tags: newTags,
    });
    if (r.success) {
      const newDoc: DocumentItem = {
        id: r.data.id,
        title: r.data.title,
        content: r.data.content,
        type: r.data.type,
        status: r.data.status,
        tags: r.data.tags || "",
        fileUrl: "",
        fileType: "",
        fileSize: 0,
        aiGenerated: false,
        createdAt: r.data.createdAt,
        updatedAt: r.data.updatedAt,
      };
      setDocuments(prev => [newDoc, ...prev]);
      setNewTitle("");
      setNewContent("");
      setNewType("document");
      setNewStatus("draft");
      setNewTags("");
      setShowNewDoc(false);
      toast.success("Document created!");
    } else toast.error(r.error || "Failed");
    setSaveStatus("idle");
  }, [newTitle, newContent, newType, newStatus, newTags]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingDoc) return;
    setSaveStatus("saving");
    const r = await updateDocumentClient(editingDoc.id, {
      title: editingDoc.title,
      content: editingDoc.content,
      type: editingDoc.type,
      tags: editingDoc.tags,
    });
    if (r.success) {
      setDocuments(prev => prev.map(d => d.id === editingDoc.id ? { ...editingDoc } : d));
      toast.success("Saved!");
      setEditingDoc(null);
    } else toast.error(r.error || "Failed");
    setSaveStatus("idle");
  }, [editingDoc]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0[...]"></path>
                </svg>
              </div>
              <span className="text-white font-semibold">Documents</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white">Dashboard</Link>
              <Link href="/notes" className="text-sm text-slate-300 hover:text-white">Notes</Link>
              <Link href="/templates" className="text-sm text-slate-300 hover:text-white">Templates</Link>
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm text-slate-400 hover:text-red-400">Sign Out</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Documents</h1>
            <p className="text-slate-400 text-sm mt-1">{documents.length} document{documents.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-2">
            {!showNewDoc && !editingDoc && (
              <button onClick={() => setShowNewDoc(true)}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white text-sm font-medium rounded-xl flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                New Document
              </button>
            )}
          </div>
        </div>

        {/* New Document Form */}
        {showNewDoc && (
          <div className="mb-8 bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Document</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">Title</label>
                  <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    placeholder="Document title..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Type</label>
                  <select value={newType} onChange={e => setNewType(e.target.value)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="document">Document</option>
                    <option value="resume">Resume</option>
                    <option value="coverLetter">Cover Letter</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Status</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="draft">Draft</option>
                    <option value="final">Final</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tags (comma separated)</label>
                <input type="text" value={newTags} onChange={e => setNewTags(e.target.value)}
                  placeholder="resume, tech, 2024"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Content</label>
                <NoteEditor initialContent={newContent} onChange={setNewContent} minHeight="250px" placeholder="Write your document content..." />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreate} disabled={saveStatus === "saving" || !newTitle.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
                  {saveStatus === "saving" ? "Creating..." : "Create Document"}
                </button>
                <button onClick={() => { setShowNewDoc(false); setNewTitle(""); setNewContent(""); }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-sm rounded-lg hover:text-white">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Document */}
        {editingDoc && (
          <div className="mb-8 bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Document</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <input type="text" value={editingDoc.title} onChange={e => setEditingDoc({ ...editingDoc, title: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm" />
                </div>
                <select value={editingDoc.type} onChange={e => setEditingDoc({ ...editingDoc, type: e.target.value })}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm">
                  <option value="document">Document</option>
                  <option value="resume">Resume</option>
                  <option value="coverLetter">Cover Letter</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-3"><div><p className="text-sm font-medium text-cyan-100">Add visual context</p><p className="text-xs text-slate-400">Insert a saved image without leaving this document.</p></div><button onClick={openGallery} className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/20">+ Add from Image Gallery</button></div>
              <NoteEditor initialContent={editingDoc.content} onChange={(html) => setEditingDoc({ ...editingDoc, content: html })} onEditorReady={(editor) => { editorRef.current = editor; }} minHeight="300px" />
              <div className="flex gap-2">
                <button onClick={handleSaveEdit} disabled={saveStatus === "saving"}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white text-sm font-medium rounded-lg">
                  {saveStatus === "saving" ? "Saving..." : "Save Changes"}
                </button>
                <button onClick={() => { setEditingDoc(null); router.push("/documents", undefined, { shallow: true }); }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-sm rounded-lg hover:text-white">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showGallery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" onClick={() => setShowGallery(false)}>
            <div className="max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between gap-4"><div><h3 className="text-xl font-semibold text-white">Insert from Image Gallery</h3><p className="mt-1 text-sm text-slate-400">Choose a saved image to place at the current editor position.</p></div><button onClick={() => setShowGallery(false)} className="rounded-lg px-3 py-2 text-slate-400 hover:bg-white/10 hover:text-white">Close</button></div>
              <div className="mt-6 rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium text-cyan-100">Upload from this device</p><p className="mt-1 text-xs text-slate-400">Browse local files, preview the image, then insert it or save it to your gallery.</p></div><button onClick={() => localImageInput.current?.click()} className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950">Browse local files</button><input ref={localImageInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(event) => handleLocalImage(event.target.files?.[0])} /></div>{localImage && <div className="mt-4 flex flex-col gap-3 rounded-lg border border-white/10 bg-slate-950/40 p-3 sm:flex-row sm:items-center"><img src={localImage.dataUrl} alt={localImage.name} className="h-24 w-32 rounded object-contain bg-slate-950" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{localImage.name}</p><p className="text-xs text-slate-500">{localImage.width} × {localImage.height}px</p></div><div className="flex gap-2"><button onClick={() => insertGalleryImage(localImage)} className="rounded-lg border border-cyan-300/30 px-3 py-2 text-xs text-cyan-100">Insert</button><button onClick={saveLocalToGallery} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200">Save to Gallery</button></div></div>}</div>
              {galleryImages.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{galleryImages.map(image => <button key={image.id} onClick={() => insertGalleryImage(image)} className="overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left transition hover:border-cyan-300/50 hover:bg-cyan-400/10"><div className="aspect-[4/3] bg-slate-950/60"><img src={image.dataUrl} alt={image.name} className="h-full w-full object-contain" /></div><div className="p-3"><p className="truncate text-sm font-medium text-white">{image.name}</p><p className="mt-1 text-xs text-slate-500">{image.width} × {image.height}px</p></div></button>)}</div> : <div className="mt-6 rounded-xl border border-dashed border-white/10 p-10 text-center"><p className="text-sm text-slate-400">Your gallery is empty.</p><a href="/image-gallery" className="mt-2 inline-block text-sm text-cyan-300 hover:text-cyan-200">Open Image Gallery to add an image →</a></div>}
            </div>
          </div>
        )}

        {/* Documents List */}
        {!showNewDoc && !editingDoc && (
          <>
            <DocumentsList documents={documents} onUpdate={setDocuments} />
          </>
        )}
      </main>
    </div>
  );
}
