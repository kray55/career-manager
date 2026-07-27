"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  status: "PROSPECTIVE" | "MEETING" | "APPLIED" | "CLOSED";
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  user: { name: string; email: string; role: string; tenantSlug: string };
  initialContacts: Contact[];
}

const COLUMNS: { key: Contact["status"]; label: string; color: string }[] = [
  { key: "PROSPECTIVE", label: "Prospective", color: "border-blue-500/50" },
  { key: "MEETING", label: "Meeting", color: "border-yellow-500/50" },
  { key: "APPLIED", label: "Applied", color: "border-green-500/50" },
  { key: "CLOSED", label: "Closed", color: "border-red-500/50" },
];

/**
 * T10-B: CRM Contacts Kanban Board
 * Uses @hello-pangea/dnd for drag-and-drop status changes.
 */
export default function CRMContactsClient({ user, initialContacts }: Props) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const getColumnContacts = useCallback(
    (status: Contact["status"]) => contacts.filter((c) => c.status === status),
    [contacts]
  );

  const handleDragEnd = useCallback(async (result: any) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as Contact["status"];

    // Optimistic update
    setContacts((prev) =>
      prev.map((c) => (c.id === draggableId ? { ...c, status: newStatus } : c))
    );

    setIsUpdating(draggableId);
    try {
      const res = await fetch("/api/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draggableId, status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Moved to ${newStatus}`);
      } else {
        // Revert
        const old = initialContacts.find((c) => c.id === draggableId);
        if (old) setContacts((prev) => prev.map((c) => (c.id === draggableId ? old : c)));
        toast.error("Failed to update status");
      }
    } catch {
      const old = initialContacts.find((c) => c.id === draggableId);
      if (old) setContacts((prev) => prev.map((c) => (c.id === draggableId ? old : c)));
      toast.error("Network error");
    } finally {
      setIsUpdating(null);
    }
  }, [initialContacts]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    try {
      const res = await fetch("/api/contacts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setContacts((prev) => prev.filter((c) => c.id !== id));
        toast.success("Contact deleted");
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Network error");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4  11-8  4 4  018  7zM12 14a7 7  00-7 7h14a7 7  00-7-7z" /></svg>
              </div>
              <span className="text-white font-semibold">CRM Contacts</span>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-.5 rounded-full">{user.tenantSlug}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white">Dashboard</Link>
              <Link href="/crm-resumes" className="text-sm text-slate-300 hover:text-white">Resumes</Link>
              <Link href="/contact" className="text-sm text-slate-300 hover:text-white">Send Email</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Contacts</h1>
            <p className="text-slate-400 text-sm mt-1">Drag and drop to change status ({contacts.length} total)</p>
          </div>
          <Link href="/contact" className="px-4 py-2 bg-primary-500/20 text-primary-300 text-sm rounded-lg hover:bg-primary-500/30 border border-primary-500/30">
            + Send Email
          </Link>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COLUMNS.map((col) => {
              const columnContacts = getColumnContacts(col.key);
              return (
                <div key={col.key} className={`bg-slate-800/30 border border-white/5 rounded-xl ${col.color} border-t-2`}>
                  <div className="px-4 py-3 border-b border-white/5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white">{col.label}</h3>
                      <span className="text-xs text-slate-500 bg-slate-800 px-2 py-.5 rounded-full">{columnContacts.length}</span>
                    </div>
                  </div>
                  <Droppable droppableId={col.key}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-2 space-y-2 min-h-[200px] transition-colors ${snapshot.isDraggingOver ? "bg-white/5" : ""}`}
                      >
                        {columnContacts.length < 1 && (
                          <div className="text-center py-6">
                            <p className="text-slate-600 text-xs">No contacts</p>
                          </div>
                        )}
                        {columnContacts.map((contact, index) => (
                          <Draggable key={contact.id} draggableId={contact.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-slate-800 border border-white/10 rounded-lg p-3 transition-all ${
                                  snapshot.isDragging ? "shadow-xl ring-2 ring-primary-500/50" : "hover:border-white/20"
                                } ${isUpdating === contact.id ? "opacity-50" : ""}`}
                              >
                                <div className="flex items-start justify-between mb-1">
                                  <h4 className="text-sm font-medium text-white truncate">{contact.name || "Unnamed"}</h4>
                                  <button onClick={() => handleDelete(contact.id)} className="p-1 text-slate-600 hover:text-red-400 opacity- group-hover:opacity-100">
                                    <svg className="w-3 h-3" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2  0116.138 21H7.862a2 2  01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1  00-1-1h-4a1 1  00-1 1v3M4 7h16" /></svg>
                                  </button>
                                </div>
                                <p className="text-xs text-slate-400 truncate">{contact.email}</p>
                                {contact.company && (
                                  <p className="text-xs text-slate-500 mt-1">{contact.company}</p>
                                )}
                                <p className="text-xs text-slate-600 mt-2">
                                  Updated {new Date(contact.updatedAt).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </main>
    </div>
  );
}
