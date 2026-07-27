"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const createBookmarkSchema = z.object({
  url: z.string().url("Must be a valid URL").max(2048, "URL too long"),
  title: z.string().min(1, "Title is required").max(500, "Title too long"),
  description: z.string().max(2000, "Description too long").optional().default(""),
  favicon: z.string().max(500, "Favicon URL too long").optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
});

// Client-side wrappers that call the API
export async function getBookmarksClient(search?: string): Promise<{ success: boolean; data: any[]; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/bookmarks?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    return { success: true, data: data.bookmarks || [] };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}

export async function updateBookmark(id: string, data: { title?: string; description?: string; isFavorite?: boolean; tags?: string[] }): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`/api/bookmarks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to update");
    return { success: true, data: result.data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteBookmark(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/bookmarks?id=${id}`, { method: "DELETE" });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to delete");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Server-side helpers for getServerSideProps
export async function getBookmarksForUser(userId: string, search?: string) {
  const where: any = { userId };
  if (search?.trim()) {
    const q = search.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { url: { contains: q, mode: "insensitive" } },
    ];
  }
  return prisma.bookmark.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });
}
