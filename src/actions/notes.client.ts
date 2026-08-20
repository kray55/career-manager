async function readJsonResponse(res: Response, fallback: string) {
  const text = await res.text();
  if (!text) return {};
  try { return JSON.parse(text); }
  catch { throw new Error(`${fallback} (server returned HTTP ${res.status})`); }
}

export async function fetchNotesClient(params?: { search?: string; tag?: string; status?: string }) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.tag) sp.set("tag", params.tag);
  if (params?.status) sp.set("status", params.status);
  const res = await fetch(`/api/notes?${sp.toString()}`);
  if (!res.ok) {
    const result = await readJsonResponse(res, "Failed to fetch notes");
    throw new Error(result.error || "Failed to fetch notes");
  }
  return readJsonResponse(res, "Failed to fetch notes");
}

export async function createNoteClient(data: { title?: string; content?: string; tags?: string[]; jobUrl?: string | null; pinned?: boolean }) {
  const res = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await readJsonResponse(res, "Failed to create note");
  if (!res.ok) throw new Error(result.error || "Failed to create note");
  return result;
}

export async function updateNoteClient(id: string, data: { title?: string; content?: string; tags?: string[]; jobUrl?: string | null; pinned?: boolean; archived?: boolean }) {
  const res = await fetch("/api/notes", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });
  const result = await readJsonResponse(res, "Failed to update note");
  if (!res.ok) throw new Error(result.error || "Failed to update note");
  return result;
}

export async function deleteNoteClient(id: string) {
  const res = await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
  const result = await readJsonResponse(res, "Failed to delete note");
  if (!res.ok) throw new Error(result.error || "Failed to delete note");
  return result;
}
