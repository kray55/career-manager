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

export async function updateBookmarkClient(id: string, data: { title?: string; description?: string; isFavorite?: boolean; tags?: string[] }): Promise<{ success: boolean; data?: any; error?: string }> {
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

export async function deleteBookmarkClient(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/bookmarks?id=${id}`, { method: "DELETE" });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to delete");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
