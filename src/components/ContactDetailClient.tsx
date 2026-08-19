"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import ContactCommunicationTimeline from "@/components/ContactCommunicationTimeline";

interface Props {
  user: { name: string; email: string; role: string; tenantSlug: string };
  contactId: string | null;
  contactEmail: string | null;
}

interface EmailAttachment {
  filename: string;
  content: string;
  contentType: string;
  encoding: "base64";
  size: number;
}

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export default function ContactDetailClient({ user, contactId, contactEmail }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "communication">("overview");
  const [showSendEmail, setShowSendEmail] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: contactEmail || "", subject: "", body: "" });
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [sending, setSending] = useState(false);

  const handleSendEmail = useCallback(async () => {
    if (!emailForm.to || !emailForm.subject || !emailForm.body) {
      toast.error("Please fill in all fields");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/email-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailForm.to,
          subject: emailForm.subject,
          html: emailForm.body.replace(/\n/g, "<br/>"),
          attachments: attachments.map(({ filename, content, contentType, encoding }) => ({ filename, content, contentType, encoding })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Email sent successfully");
        setShowSendEmail(false);
        setEmailForm({ to: contactEmail || "", subject: "", body: "" });
        setAttachments([]);
      } else {
        toast.error(data.error || "Failed to send email");
      }
    } catch {
      toast.error("Failed to send email");
    } finally {
      setSending(false);
    }
  }, [emailForm, contactEmail, attachments]);

  const handleAttachmentChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const selectedBytes = files.reduce((total, file) => total + file.size, 0);
    const currentBytes = attachments.reduce((total, file) => total + file.size, 0);
    if (selectedBytes + currentBytes > MAX_ATTACHMENT_BYTES) {
      toast.error("Attachments must total 10 MB or less");
      event.target.value = "";
      return;
    }
    if (attachments.length + files.length > 5) {
      toast.error("You can attach up to 5 files");
      event.target.value = "";
      return;
    }
    Promise.all(files.map((file) => new Promise<EmailAttachment>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        resolve({
          filename: file.name,
          content: result.split(",", 2)[1] || "",
          contentType: file.type || "application/octet-stream",
          encoding: "base64",
          size: file.size,
        });
      };
      reader.onerror = () => reject(new Error("Could not read attachment"));
      reader.readAsDataURL(file);
    }))).then((newFiles) => setAttachments((current) => [...current, ...newFiles])).catch(() => toast.error("Could not read attachment"));
    event.target.value = "";
  }, [attachments]);

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "communication" as const, label: "Communication" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Nav */}
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-white font-semibold">Contact</span>
              {contactEmail && <span className="text-sm text-slate-400">| {contactEmail}</span>}
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white">Dashboard</Link>
              <Link href="/crm-resumes" className="text-sm text-slate-300 hover:text-white">Resumes</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1 border border-white/10 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab.key
                  ? "bg-primary-500/20 text-primary-300 border border-primary-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Contact Summary Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Contact Information</h2>
                <button
                  onClick={() => setShowSendEmail(true)}
                  className="px-4 py-2 bg-primary-500/20 text-primary-300 text-sm rounded-lg hover:bg-primary-500/30 border border-primary-500/30 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 014.22 0l7.89-5.26M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Email
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Email:</span>
                  <span className="text-white ml-2">{contactEmail || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Contact ID:</span>
                  <span className="text-white ml-2 font-mono text-xs">{contactId || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Tenant:</span>
                  <span className="text-white ml-2">{user.tenantSlug}</span>
                </div>
              </div>
            </div>

            {/* Send Email Modal */}
            {showSendEmail && (
              <div className="fixed inset- z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-slate-800 border border-white/10 rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Send Email</h3>
                    <button onClick={() => setShowSendEmail(false)} className="text-slate-400 hover:text-white">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">To</label>
                      <input
                        type="email"
                        value={emailForm.to}
                        onChange={(e) => setEmailForm((prev) => ({ ...prev, to: e.target.value }))}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50"
                        placeholder="recipient@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Subject</label>
                      <input
                        type="text"
                        value={emailForm.subject}
                        onChange={(e) => setEmailForm((prev) => ({ ...prev, subject: e.target.value }))}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50"
                        placeholder="Email subject"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Message</label>
                      <textarea
                        value={emailForm.body}
                        onChange={(e) => setEmailForm((prev) => ({ ...prev, body: e.target.value }))}
                        rows={6}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50"
                        placeholder="Write your message..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Attachments</label>
                      <input
                        type="file"
                        multiple
                        onChange={handleAttachmentChange}
                        className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-500/20 file:px-3 file:py-2 file:text-primary-200 hover:file:bg-primary-500/30"
                      />
                      <p className="mt-1 text-xs text-slate-500">Up to 5 files, 10 MB total.</p>
                      {attachments.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs text-slate-300">
                          {attachments.map((file) => (
                            <li key={`${file.filename}-${file.size}`} className="flex items-center justify-between rounded-lg bg-slate-900/40 px-2 py-1">
                              <span className="truncate">{file.filename}</span>
                              <button type="button" onClick={() => setAttachments((current) => current.filter((item) => item !== file))} className="ml-2 text-slate-500 hover:text-white">Remove</button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={() => setShowSendEmail(false)}
                        className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendEmail}
                        disabled={sending}
                        className="px-5 py-2 bg-gradient-to-r from-primary-500 to-primary-700 text-white text-sm font-medium rounded-xl hover:from-primary-600 hover:to-primary-800 disabled:opacity-50"
                      >
                        {sending ? "Sending..." : "Send Email"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "communication" && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-white mb-4">Communication History</h2>
            <ContactCommunicationTimeline contactEmail={contactEmail || undefined} contactId={contactId || undefined} />
          </div>
        )}
      </main>
    </div>
  );
}
