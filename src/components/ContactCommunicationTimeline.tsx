"use client";

import { useState, useEffect, useCallback } from "react";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface EmailLogEntry {
  id: string;
  to: string;
  subject: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
  errorMsg?: string | null;
}

interface CommunicationEvent {
  id: string;
  type: "email" | "chat" | "note";
  title: string;
  summary: string;
  timestamp: string;
  status?: string;
  error?: string | null;
}

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface ContactCommunicationTimelineProps {
  contactEmail?: string;
  contactId?: string;
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export default function ContactCommunicationTimeline({
  contactEmail,
  contactId,
}: ContactCommunicationTimelineProps) {
  const [events, setEvents] = useState<CommunicationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "email" | "chat" | "note">("all");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch email logs for this contact
      const params = new URLSearchParams();
      if (contactEmail) params.set("to", contactEmail);
      if (contactId) params.set("contactId", contactId);

      const res = await fetch(`/api/email-logs?${params.toString()}`);
      if (res.ok) {
        const data: EmailLogEntry[] = await res.json();
        const mapped: CommunicationEvent[] = data.map((log) => ({
          id: log.id,
          type: "email",
          title: log.subject,
          summary: `To: ${log.to}`,
          timestamp: log.sentAt || log.createdAt,
          status: log.status,
          error: log.errorMsg,
        }));
        setEvents(mapped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, [contactEmail, contactId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = filter === "all" ? events : events.filter((e) => e.type === filter);

  const statusBadge = (status?: string) => {
    if (status === "SENT") return <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-300 rounded-full">Sent</span>;
    if (status === "FAILED") return <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-300 rounded-full">Failed</span>;
    if (status === "PENDING") return <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-300 rounded-full">Pending</span>;
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "email", "chat", "note"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              filter === f
                ? "bg-primary-500/20 text-primary-300 border border-primary-500/30"
                : "text-slate-400 hover:text-white bg-slate-800/30 border border-transparent"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="text-center py-8 text-slate-500 text-sm">Loading communications...</div>
   ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <svg className="w-10 h-10 mx-auto mb-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 014.22 0l7.89-5.26M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">No communications recorded yet.</p>
          <p className="text-xs text-slate-600 mt-1">Send an email to start the conversation history.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top- bottom- w-px bg-white/10" />

          <div className="space-y-4">
            {filtered.map((event) => (
              <div key={event.id} className="relative pl-10">
                {/* Timeline dot */}
                <div className={`absolute left-2.5 top-2 w-3 h-3 rounded-full border-2 ${
                  event.type === "email"
                    ? "border-blue-400 bg-blue-500/20"
                    : event.type === "chat"
                    ? "border-green-400 bg-green-500/20"
                    : "border-purple-400 bg-purple-500/20"
                }`} />

                {/* Card */}
                <div className="bg-slate-800/30 border border-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white">{event.title}</span>
                      {statusBadge(event.status)}
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{event.summary}</p>
                  {event.error && (
                    <p className="text-xs text-red-400 mt-1">Error: {event.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
