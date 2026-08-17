"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import CommissionWidget from "./CommissionWidget";

interface Props {
  user: { name: string; email: string; role: string; totpEnabled: boolean; tenantSlug: string };
  stats: { bookmarkCount: number; noteCount: number; documentCount: number; resumeCount: number; contactCount: number };
}

export default function DashboardView({ user, stats }: Props) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const menus = [
    { label: "Workspace", items: [["/dashboard", "Overview", "Your career command center"], ["/library", "Library & bookmarks", "Keep opportunities within reach"]] },
    { label: "Build", items: [["/notes", "Notes", "Turn research into action"], ["/documents", "Documents", "Organize your career files"], ["/templates", "Templates", "Start from a proven format"]] },
    { label: "Relationships", items: [["/crm-resumes", "Resumes", "Tailor your story for each role"], ["/crm-contacts", "Contacts & CRM", "Build momentum with your network"], ["/contact", "Email Hub", "Follow up with confidence"]] },
    { label: "Resources", items: [["/store", "Career Store", "Discover tools for your next move"], ["/templates", "AI Generator", "Create polished career content"], ["/affiliate", "Affiliate Program", "Share resources and track commissions"]] },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav aria-label="Career Manager primary navigation" className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-4 pr-20 sm:px-6 lg:px-8 lg:pr-8">
          <a href="/dashboard" className="flex min-w-0 items-center gap-3" onClick={() => setOpenMenu(null)}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-cyan-500 shadow-lg shadow-indigo-950/40">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v10a2 2 0 002 2z" /></svg>
            </span>
            <span className="hidden min-w-0 sm:block"><span className="block truncate text-sm font-semibold text-white">Career Manager</span><span className="block truncate text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">{user.tenantSlug} workspace</span></span>
          </a>
          <div className="hidden items-center gap-1 lg:flex">
            {menus.map(menu => <div key={menu.label} className="relative">
              <button type="button" aria-haspopup="menu" aria-expanded={openMenu === menu.label} onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)} className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">{menu.label}<span className={`text-[0.65rem] transition-transform ${openMenu === menu.label ? "rotate-180" : ""}`}>⌄</span></button>
              {openMenu === menu.label && <div role="menu" className="absolute left-0 top-full mt-2 w-72 rounded-2xl border border-white/10 bg-[#101a34] p-2 shadow-2xl shadow-slate-950/50 backdrop-blur-2xl">{menu.items.map(([href, label, description]) => <a key={`${href}-${label}`} href={href} role="menuitem" onClick={() => setOpenMenu(null)} className="block rounded-xl px-3 py-3 transition hover:bg-white/10"><span className="block text-sm font-medium text-white">{label}</span><span className="mt-1 block text-xs leading-5 text-slate-400">{description}</span></a>)}</div>}
            </div>)}
          </div>
          <div className="hidden items-center lg:flex">
            <div className="relative">
              <button type="button" aria-haspopup="menu" aria-expanded={openMenu === "Account"} onClick={() => setOpenMenu(openMenu === "Account" ? null : "Account")} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-400/20 text-xs font-semibold text-indigo-200">{user.name.slice(0, 1).toUpperCase()}</span>{user.name}<span className="text-[0.65rem]">⌄</span></button>
              {openMenu === "Account" && <div role="menu" className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-white/10 bg-[#101a34] p-2 shadow-2xl shadow-slate-950/50 backdrop-blur-2xl"><a href="/profile/mfa" role="menuitem" onClick={() => setOpenMenu(null)} className="block rounded-xl px-3 py-3 text-sm text-slate-200 hover:bg-white/10">{user.totpEnabled ? "✓ 2FA active" : "Enable 2FA"}<span className="mt-1 block text-xs text-slate-400">Protect your account</span></a>{isAdmin && <a href="/admin" role="menuitem" onClick={() => setOpenMenu(null)} className="block rounded-xl px-3 py-3 text-sm text-slate-200 hover:bg-white/10">Admin console<span className="mt-1 block text-xs text-slate-400">Manage your workspace</span></a>}<button type="button" role="menuitem" onClick={() => signOut({ callbackUrl: "/login" })} className="block w-full rounded-xl px-3 py-3 text-left text-sm text-rose-300 hover:bg-rose-400/10">Sign out<span className="mt-1 block text-xs text-slate-400">Return to the sign-in page</span></button></div>}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10"><h1 className="text-3xl font-bold text-white">Welcome back, {user.name}</h1><p className="text-slate-400 mt-1">Your career management overview.</p></div>

        <div className="grid grid-cols-12 gap-6 mb-10">
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                </div>
                <div><p className="text-2xl font-bold text-white">{stats.bookmarkCount}</p><p className="text-xs text-slate-400">Bookmarks</p></div>
              </div>
              <a href="/library" className="text-xs text-primary-400 hover:text-primary-300">View Library →</a>
            </div>
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <a href="/notes" className="block bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </div>
                <div><p className="text-2xl font-bold text-white">{stats.noteCount}</p><p className="text-xs text-slate-400">Notes</p></div>
              </div>
              <span className="text-xs text-green-400 hover:text-green-300">View Notes →</span>
            </a>
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <a href="/documents" className="block bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div><p className="text-2xl font-bold text-white">{stats.documentCount}</p><p className="text-xs text-slate-400">Documents</p></div>
              </div>
              <span className="text-xs text-blue-400 hover:text-blue-300">View Documents →</span>
            </a>
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <a href="/crm-resumes" className="block bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div><p className="text-2xl font-bold text-white">{stats.resumeCount}</p><p className="text-xs text-slate-400">Resumes</p></div>
              </div>
              <span className="text-xs text-purple-400 hover:text-purple-300">Build Resumes →</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 mb-10">
          <div className="col-span-12 sm:col-span-6 lg:col-span-4">
            <a href="/crm-contacts" className="block bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div><p className="text-2xl font-bold text-white">{stats.contactCount}</p><p className="text-xs text-slate-400">Contacts (CRM)</p></div>
              </div>
              <span className="text-xs text-cyan-400 hover:text-cyan-300">Kanban Board →</span>
            </a>
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-4">
            <a href="/contact" className="block bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 014.22 0l7.89-5.26M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div><p className="text-sm text-slate-400">Email Hub</p></div>
              </div>
              <span className="text-xs text-pink-400 hover:text-pink-300">Send Email →</span>
            </a>
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-4">
            <a href="/store" className="block bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                </div>
                <div><p className="text-sm text-slate-400">Career Store</p></div>
              </div>
              <span className="text-xs text-purple-400 hover:text-purple-300">Browse Resources →</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-12 gap-4">
              <a href="/notes" className="col-span-12 sm:col-span-4 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-lg p-4 text-center transition-all group">
                <svg className="w-6 h-6 text-green-400 mx-auto mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                <p className="text-sm text-white font-medium">New Note</p>
                <p className="text-xs text-slate-500 mt-1">Write career notes</p>
              </a>
              <a href="/crm-resumes" className="col-span-12 sm:col-span-4 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-lg p-4 text-center transition-all group">
                <svg className="w-6 h-6 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="text-sm text-white font-medium">New Resume</p>
                <p className="text-xs text-slate-500 mt-1">Build with Resume Builder</p>
              </a>
              <a href="/crm-contacts" className="col-span-12 sm:col-span-4 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-lg p-4 text-center transition-all group">
                <svg className="w-6 h-6 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <p className="text-sm text-white font-medium">CRM Contacts</p>
                <p className="text-xs text-slate-500 mt-1">Kanban board</p>
              </a>
              <a href="/templates" className="col-span-12 sm:col-span-4 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-lg p-4 text-center transition-all group">
                <svg className="w-6 h-6 text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 01-2 2H7a2 2 0 01-2-2m14 0V7a2 2 0 01-2-2H7a2 2 0 01-2 2v4" /></svg>
                <p className="text-sm text-white font-medium">Use Template</p>
                <p className="text-xs text-slate-500 mt-1">Resume/Cover Letter</p>
              </a>
              <a href="/store" className="col-span-12 sm:col-span-4 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-lg p-4 text-center transition-all group">
                <svg className="w-6 h-6 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                <p className="text-sm text-white font-medium">Career Store</p>
                <p className="text-xs text-slate-500 mt-1">Browse & Purchase</p>
              </a>
              <a href="/contact" className="col-span-12 sm:col-span-4 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-lg p-4 text-center transition-all group">
                <svg className="w-6 h-6 text-pink-400 mx-auto mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 014.22 0l7.89-5.26M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <p className="text-sm text-white font-medium">Send Email</p>
                <p className="text-xs text-slate-500 mt-1">Contact via SMTP</p>
              </a>
              <a href="/profile/mfa" className="col-span-12 sm:col-span-4 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-lg p-4 text-center transition-all group">
                <svg className="w-6 h-6 text-green-400 mx-auto mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955  0112 2.944a11.955 11.955  01-8.618 3.04A12.02 12.02  003 9c 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622  -1.042-.133-2.052-.382-3.016z" /></svg>
                <p className="text-sm text-white font-medium">Security</p>
                <p className="text-xs text-slate-500 mt-1">Manage 2FA settings</p>
              </a>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-white mb-4">🤖 AI Generator</h2>
              <p className="text-sm text-slate-400 mb-4">Generate resumes, cover letters, and professional summaries with AI.</p>
              <a href="/templates" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-700 text-white text-sm font-medium rounded-xl hover:from-purple-600 hover:to-purple-800">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Generate with AI
              </a>
            </div>
            <CommissionWidget />
          </div>
        </div>
      </main>
    </div>
  );
}
