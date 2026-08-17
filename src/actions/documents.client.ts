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
