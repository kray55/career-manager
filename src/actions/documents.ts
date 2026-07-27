"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const createDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(500).default("Untitled Document"),
  content: z.string().default(""),
  type: z.enum(["document", "resume", "coverLetter", "other"]).default("document"),
  status: z.enum(["draft", "final", "archived"]).default("draft"),
  tags: z.string().max(500).default(""),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
  type: z.enum(["document", "resume", "coverLetter", "other"]).optional(),
  status: z.enum(["draft", "final", "archived"]).optional(),
  tags: z.string().max(500).optional(),
  fileUrl: z.string().max(2048).optional(),
  fileType: z.string().max(100).optional(),
  fileSize: z.number().int().optional(),
});

// ── Client-side API calls ──

export async function getDocumentsClient(params?: { search?: string; type?: string; status?: string }): Promise<{ success: boolean; data: any[]; error?: string }> {
  try {
    const sp = new URLSearchParams();
    if (params?.search) sp.set("search", params.search);
    if (params?.type) sp.set("type", params.type);
    if (params?.status) sp.set("status", params.status);
    const res = await fetch(`/api/documents?${sp.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch documents");
    const data = await res.json();
    return { success: true, data: data.documents || [] };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}

export async function createDocumentClient(data: { title?: string; content?: string; type?: string; status?: string; tags?: string }): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to create document");
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateDocumentClient(id: string, data: any): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch("/api/documents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to update document");
    return { success: true, data: result.data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteDocumentClient(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to delete document");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── Server-side helpers ──

export async function getDocumentsForUser(userId: string, options?: { search?: string; type?: string; status?: string }) {
  const where: any = { userId };
  if (options?.type) where.type = options.type;
  if (options?.status) where.status = options.status;
  else where.status = { not: "archived" };
  if (options?.search?.trim()) {
    const q = options.search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
      { tags: { contains: q, mode: "insensitive" } },
    ];
  }
  return prisma.document.findMany({ where, orderBy: { updatedAt: "desc" }, take: 100 });
}
