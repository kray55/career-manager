"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const createNoteSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title too long").default("Untitled Note"),
  content: z.string().default(""),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  jobUrl: z.string().max(2048).optional().nullable(),
  pinned: z.boolean().optional().default(false),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  jobUrl: z.string().max(2048).optional().nullable(),
  pinned: z.boolean().optional(),
  archived: z.boolean().optional(),
});

// ── Client-side API calls ──

export async function getNotesClient(params?: { search?: string; archived?: boolean; pinned?: boolean }): Promise<{ success: boolean; data: any[]; error?: string }> {
  try {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.archived !== undefined) sp.set("archived", String(params.archived));
    if (params?.pinned !== undefined) sp.set("pinned", String(params.pinned));
    const res = await fetch(`/api/notes?${sp.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch notes");
    const data = await res.json();
    return { success: true, data: data.notes || [] };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}

export async function getNoteClient(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`/api/notes?id=${id}`);
    if (!res.ok) throw new Error("Failed to fetch note");
    const data = await res.json();
    return { success: true, data: data.note };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createNoteClient(data: { title?: string; content?: string; tags?: string[]; jobUrl?: string | null; pinned?: boolean }): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to create note");
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateNoteClient(id: string, data: { title?: string; content?: string; tags?: string[]; jobUrl?: string | null; pinned?: boolean; archived?: boolean }): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch("/api/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to update note");
    return { success: true, data: result.data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteNoteClient(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to delete note");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── Server-side helpers for SSR ──

export async function getNotesForUser(userId: string, options?: { search?: string; archived?: boolean }) {
  const where: any = { userId };
  if (options?.archived !== undefined) where.archived = options.archived;
  else where.archived = false;
  if (options?.search?.trim()) {
    const q = options.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
    ];
  }
  return prisma.note.findMany({ where, orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }], take: 100 });
}
