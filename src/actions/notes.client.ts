export async function getNotesClient(params?: { search?: string; tag?: string; status?: string }) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.tag) sp.set("tag", params.tag);
  if (params?.status) sp.set("status", params.status);
  const res = await fetch(`/api/notes?${sp.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch notes");
  return res.json();
}

export async function createNoteClient(data: { title?: string; content?: string; tags?: string }) {
  const res = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Failed to create note");
  return result;
}

export async function updateNoteClient(id: string, data: any) {
  const res = await fetch("/api/notes", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Failed to update note");
  return result;
}

export async function deleteNoteClient(id: string) {
  const res = await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Failed to delete note");
  return result;
}
