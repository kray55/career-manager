"use client";

import { useCallback, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Typography from "@tiptap/extension-typography";
import TextAlign from "@tiptap/extension-text-align";
import CharacterCount from "@tiptap/extension-character-count";
import Image from "@tiptap/extension-image";

interface NoteEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  editable?: boolean;
  minHeight?: string;
  placeholder?: string;
  onEditorReady?: (editor: any) => void;
}

export default function NoteEditor({
  initialContent = "",
  onChange,
  editable = true,
  minHeight = "300px",
  placeholder = "Start writing your note...",
  onEditorReady,
}: NoteEditorProps) {
  const [isReady, setIsReady] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: { class: "text-primary-400 underline hover:text-primary-300" },
      }),
      Placeholder.configure({ placeholder }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Typography,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      CharacterCount,
      Image.configure({ inline: false, allowBase64: true, HTMLAttributes: { class: "max-w-full rounded-xl shadow-lg" } }),
    ],
    content: initialContent || "",
    editable,
    onUpdate: ({ editor: ed }: any) => { onChange?.(ed.getHTML()); },
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none min-h-[200px] px-4 py-3 text-slate-100",
      },
    },
  } as any) as any;

  useEffect(() => { if (editor) { setIsReady(true); onEditorReady?.(editor); } }, [editor, onEditorReady]);

  useEffect(() => {
    if (editor && initialContent && !editor.isDestroyed) {
      const current = editor.getHTML();
      if (current !== initialContent) editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  useEffect(() => {
    if (editor && !editor.isDestroyed) editor.setEditable(editable);
  }, [editor, editable]);

  if (!editor || !isReady) return null;

  const tb = (onClick: any, active: any, title: string, children: any) => (
    <button type="button" onClick={onClick} title={title}
      className={`p-1.5 rounded transition-colors ${active ? "bg-primary-600/30 text-primary-300" : "text-slate-400 hover:text-white hover:bg-slate-700/50"}`}>
      {children}
    </button>
  );

  const IC = ({ d }: { d: string }) => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>
  );

  const D = () => <span className="w-px h-5 bg-slate-700 mx-1" />;

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-slate-900/50"
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "b") { e.preventDefault(); editor.chain().focus().toggleBold().run(); }
        if ((e.ctrlKey || e.metaKey) && e.key === "i") { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }
        if ((e.ctrlKey || e.metaKey) && e.key === "u") { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }
      }}>
      {editable && (
        <div className="flex flex-wrap items-center gap-.5 px-3 py-2 border-b border-white/10 bg-slate-800/50 sticky top- z-10 overflow-x-auto">
          {tb(() => editor.chain().focus().toggleBold().run(), editor.isActive("bold"), "Bold", <IC d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 -2.26-1.75-4-4-4H7v14h7.04c2.09  3.71-1.7 3.71-3.79 -1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83  1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83  1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />)}
          {tb(() => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"), "Italic", <IC d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />)}
          {tb(() => editor.chain().focus().toggleUnderline().run(), editor.isActive("underline"), "Underline", <IC d="M12 17c3.31  6-2.69 6-6V3h-2.5v8c 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />)}
          {tb(() => editor.chain().focus().toggleStrike().run(), editor.isActive("strike"), "Strikethrough", <IC d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z" />)}
          {tb(() => editor.chain().focus().toggleCode().run(), editor.isActive("code"), "Code", <IC d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />)}
          <D />
          {tb(() => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive("heading", { level: 1 }), "H1", <span className="text-xs font-bold">H1</span>)}
          {tb(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }), "H2", <span className="text-xs font-bold">H2</span>)}
          {tb(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 }), "H3", <span className="text-xs font-bold">H3</span>)}
          <D />
          {tb(() => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"), "Bullet List", <IC d="M4 10.5c-.83 -1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm-6c-.83 -1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm 12c-.83 -1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm-6h14v-2H7v2zm-8v2h14V5H7z" />)}
          {tb(() => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"), "Ordered List", <IC d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm 14h14v-2H7v2zm-6h14v-2H7v2z" />)}
          {tb(() => editor.chain().focus().toggleTaskList().run(), editor.isActive("taskList"), "Task List", <IC d="M19 3H5c-1.1 -2 .9-2 2v14c 1.1.9 2 2 2h14c1.1  2-.9 2-2V5c-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />)}
          {tb(() => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"), "Blockquote", <IC d="M6 17h3l2-4V7H5v6h3zm8 h3l2-4V7h-6v6h3z" />)}
          {tb(() => editor.chain().focus().toggleCodeBlock().run(), editor.isActive("codeBlock"), "Code Block", <IC d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />)}
          <D />
          {tb(() => { const url = window.prompt("Enter URL:", editor.getAttributes("link").href || ""); if (url) editor.chain().focus().setLink({ href: url }).run(); else if (url === "") editor.chain().focus().unsetLink().run(); }, editor.isActive("link"), "Link", <IC d="M3.9 12c-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 -5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 -3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71  3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76  5-2.24 5-5s-2.24-5-5-5z" />)}
          {editor.isActive("link") && tb(() => editor.chain().focus().unsetLink().run(), false, "Remove Link", <IC d="M17 7h-4v1.9h4c1.71  3.1 1.39 3.1 3.1  1.43-.98 2.63-2.31 2.98l1.46 1.46C20.88 15.61 22 13.95 22 12c-2.76-2.24-5-5-5zm-1 4h-2.19l2 2H16zM2 4.27l3.11 3.11C3.29 8.12 2 9.91 2 12c 2.76 2.24 5 5 5h4v-1.9H7c-1.71 -3.1-1.39-3.1-3.1 -1.59 1.21-2.9 2.76-3.07L8.73 11H8v2h2.73L13 15.27V17h1.73l4.01 4.01 1.41-1.41L3.41 2.86 2 4.27z" />)}
          {tb(() => editor.chain().focus().setHorizontalRule().run(), false, "HR", <IC d="M3 13h18v-2H3v2z" />)}
          <D />
          {tb(() => editor.chain().focus().clearNodes().unsetAllMarks().run(), false, "Clear", <IC d="M6 6l12 12M6 18L18 6" />)}
        </div>
      )}
      <div style={{ minHeight: minHeight }} className="relative">
        <EditorContent editor={editor} />
      </div>
      {editable && (
        <div className="px-4 py-1.5 border-t border-white/5 text-xs text-slate-500 flex items-center gap-4">
          <span>{editor.getText().length} chars</span>
          <span>{editor.getText().split(/\s+/).filter(Boolean).length} words</span>
        </div>
      )}
    </div>
  );
}
