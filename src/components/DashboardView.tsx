"use client";
import { signOut } from "next-auth/react";
import Link from "next/link";
import CommissionWidget from "./CommissionWidget";

interface Props {
  user: { name: string; email: string; role: string; totpEnabled: boolean; tenantSlug: string };
  stats: { bookmarkCount: number; noteCount: number; documentCount: number; resumeCount: number; contactCount: number };
}

export default function DashboardView({ user, stats }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.193 23.193  0112 15c-3.183  -6.22-.62-9-1.745M16 6V4a2 2  00-2-2h-4a2 2  00-2 2v2m4 6h.01M5 20h14a2 2  002-2V8a2 2  00-2-2H5a2 2  00-2 2v10a2 2  002 2z" /></svg>
              </div>
              <span className="text-white font-semibold">Career Manager</span>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-.5 rounded-full">{user.tenantSlug}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/notes" className="text-sm text-slate-300 hover:text-white">Notes</Link>
              <Link href="/documents" className="text-sm text-slate-300 hover:text-white">Documents</Link>
              <Link href="/templates" className="text-sm text-slate-300 hover:text-white">Templates</Link>
              <Link href="/crm-resumes" className="text-sm text-slate-300 hover:text-white">Resumes</Link>
              <Link href="/crm-contacts" className="text-sm text-slate-300 hover:text-white">Contacts</Link>
              <Link href="/library" className="text-sm text-slate-300 hover:text-white">Library</Link>
              <Link href="/store" className="text-sm text-slate-300 hover:text-white">Store</Link>
              {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && <Link href="/admin" className="text-sm text-slate-300 hover:text-white">Admin</Link>}
              <Link href="/profile/mfa" className={`text-sm ${user.totpEnabled ? "text-green-400 hover:text-green-300" : "text-slate-300 hover:text-white"}`}>
                {user.totpEnabled ? "✓ 2FA Active" : "Enable 2FA"}
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm text-slate-400 hover:text-red-400">Sign Out</button>
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
                  <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2  012-2h10a2 2  012 2v16l-7-3.5L5 21V5z" /></svg>
                </div>
                <div><p className="text-2xl font-bold text-white">{stats.bookmarkCount}</p><p className="text-xs text-slate-400">Bookmarks</p></div>
              </div>
              <Link href="/library" className="text-xs text-primary-400 hover:text-primary-300">View Library →</Link>
            </div>
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <Link href="/notes" className="block bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2  00-2 2v11a2 2  002 2h11a2 2  002-2v-5m-1.414-9.414a2 2  112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </div>
                <div><p className="text-2xl font-bold text-white">{stats.noteCount}</p><p className="text-xs text-slate-400">Notes</p></div>
              </div>
              <span className="text-xs text-green-400 hover:text-green-300">View Notes →</span>
            </Link>
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <Link href="/documents" className="block bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2  01-2-2V5a2 2  012-2h5.586a1 1  01.707.293l5.414 5.414a1 1  01.293.707V19a2 2  01-2 2z" /></svg>
                </div>
                <div><p className="text-2xl font-bold text-white">{stats.documentCount}</p><p className="text-xs text-slate-400">Documents</p></div>
              </div>
              <span className="text-xs text-blue-400 hover:text-blue-300">View Documents →</span>
            </Link>
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <Link href="/crm-resumes" className="block bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2  01-2-2V5a2 2  012-2h5.586a1 1  01.707.293l5.414 5.414a1 1  01.293.707V19a2 2  01-2 2z" /></svg>
                </div>
                <div><p className="text-2xl font-bold text-white">{stats.resumeCount}</p><p className="text-xs text-slate-400">Resumes</p></div>
              </div>
              <span className="text-xs text-purple-400 hover:text-purple-300">Build Resumes →</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 mb-10">
          <div className="col-span-12 sm:col-span-6 lg:col-span-4">
            <Link href="/crm-contacts" className="block bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4  11-8  4 4  018  7zM12 14a7 7  00-7 7h14a7 7  00-7-7z" /></svg>
                </div>
                <div><p className="text-2xl font-bold text-white">{stats.contactCount}</p><p className="text-xs text-slate-400">Contacts (CRM)</p></div>
              </div>
              <span className="text-xs text-cyan-400 hover:text-cyan-300">Kanban Board →</span>
            </Link>
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-4">
            <Link href="/contact" className="block bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2  014.22 l7.89-5.26M5 19h14a2 2  002-2V7a2 2  00-2-2H5a2 2  00-2 2v10a2 2  002 2z" /></svg>
                </div>
                <div><p className="text-sm text-slate-400">Email Hub</p></div>
              </div>
              <span className="text-xs text-pink-400 hover:text-pink-300">Send Email →</span>
            </Link>
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-4">
            <Link href="/store" className="block bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4  00-8 v4M5 9h14l1 12H4L5 9z" /></svg>
                </div>
                <div><p className="text-sm text-slate-400">Career Store</p></div>
              </div>
              <span className="text-xs text-purple-400 hover:text-purple-300">Browse Resources →</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-12 gap-4">
              <Link href="/notes" className="col-span-12 sm:col-span-4 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-lg p-4 text-center transition-all group">
                <svg className="w-6 h-6 text-green-400 mx-auto mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2  00-2 2v11a2 2  002 2h11a2 2  002-2v-5m-1.414-9.414a2 2  112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                <p className="text-sm text-white font-medium">New Note</p>
                <p className="text-xs text-slate-500 mt-1">Write career notes</p>
              </Link>
              <Link href="/crm-resumes" className="col-span-12 sm:col-span-4 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-lg p-4 text-center transition-all group">
                <svg className="w-6 h-6 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2  01-2-2V5a2 2  012-2h5.586a1 1  01.707.293l5.414 5.414a1 1  01.293.707V19a2 2  01-2 2z" /></svg>
                <p className="text-sm text-white font-medium">New Resume</p>
                <p className="text-xs text-slate-500 mt-1">Build with Resume Builder</p>
              </Link>
              <Link href="/crm-contacts" className="col-span-12 sm:col-span-4 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-lg p-4 text-center transition-all group">
                <svg className="w-6 h-6 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4  11-8  4 4  018  7zM12 14a7 7  00-7 7h14a7 7  00-7-7z" /></svg>
                <p className="text-sm text-white font-medium">CRM Contacts</p>
                <p className="text-xs text-slate-500 mt-1">Kanban board</p>
              </Link>
              <Link href="/templates" className="col-span-12 sm:col-span-4 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-lg p-4 text-center transition-all group">
                <svg className="w-6 h-6 text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 a2 2  01-2 2H7a2 2  01-2-2m14 V7a2 2  01-2-2H7a2 2  01-2 2v4" /></svg>
                <p className="text-sm text-white font-medium">Use Template</p>
                <p className="text-xs text-slate-500 mt-1">Resume/Cover Letter</p>
              </Link>
              <Link href="/store" className="col-span-12 sm:col-span-4 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-lg p-4 text-center transition-all group">
                <svg className="w-6 h-6 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4  00-8 v4M5 9h14l1 12H4L5 9z" /></svg>
                <p className="text-sm text-white font-medium">Career Store</p>
                <p className="text-xs text-slate-500 mt-1">Browse & Purchase</p>
              </Link>
              <Link href="/contact" className="col-span-12 sm:col-span-4 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-lg p-4 text-center transition-all group">
                <svg className="w-6 h-6 text-pink-400 mx-auto mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2  014.22 l7.89-5.26M5 19h14a2 2  002-2V7a2 2  00-2-2H5a2 2  00-2 2v10a2 2  002 2z" /></svg>
                <p className="text-sm text-white font-medium">Send Email</p>
                <p className="text-xs text-slate-500 mt-1">Contact via SMTP</p>
              </Link>
              <Link href="/profile/mfa" className="col-span-12 sm:col-span-4 bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-lg p-4 text-center transition-all group">
                <svg className="w-6 h-6 text-green-400 mx-auto mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955  0112 2.944a11.955 11.955  01-8.618 3.04A12.02 12.02  003 9c 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622  -1.042-.133-2.052-.382-3.016z" /></svg>
                <p className="text-sm text-white font-medium">Security</p>
                <p className="text-xs text-slate-500 mt-1">Manage 2FA settings</p>
              </Link>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-white mb-4">🤖 AI Generator</h2>
              <p className="text-sm text-slate-400 mb-4">Generate resumes, cover letters, and professional summaries with AI.</p>
              <Link href="/templates" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-700 text-white text-sm font-medium rounded-xl hover:from-purple-600 hover:to-purple-800">
                <svg className="w-4 h-4" fill="none" viewBox="  24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Generate with AI
              </Link>
            </div>
            <CommissionWidget />
          </div>
        </div>
      </main>
    </div>
  );
}
