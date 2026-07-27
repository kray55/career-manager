"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

interface Stats { userCount: number; bookmarkCount: number; tenantCount: number }
interface User { id: string; name: string | null; email: string | null; role: string; createdAt: string }

interface Props { stats: Stats; recentUsers: User[] }

export default function AdminView({ stats, recentUsers }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const role = (session?.user as any)?.role;

  if (role !== "SUPER_ADMIN" && role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <span className="text-white font-semibold">Admin Panel</span>
              <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">{role}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-slate-300 hover:text-white">Dashboard</Link>
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm text-slate-400 hover:text-red-400">Sign Out</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8"><h1 className="text-2xl font-bold text-white">Admin Dashboard</h1><p className="text-slate-400 mt-1">Platform overview and management.</p></div>

        <div className="grid grid-cols-12 gap-6 mb-10">
          <div className="col-span-12 sm:col-span-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <p className="text-3xl font-bold text-white">{stats.userCount}</p>
              <p className="text-sm text-slate-400 mt-1">Total Users</p>
            </div>
          </div>
          <div className="col-span-12 sm:col-span-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <p className="text-3xl font-bold text-white">{stats.bookmarkCount}</p>
              <p className="text-sm text-slate-400 mt-1">Total Bookmarks</p>
            </div>
          </div>
          <div className="col-span-12 sm:col-span-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <p className="text-3xl font-bold text-white">{stats.tenantCount}</p>
              <p className="text-sm text-slate-400 mt-1">Organizations</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10"><h3 className="text-white font-medium">Recent Users</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-slate-500 text-xs uppercase tracking-wider">
                <th className="text-left px-6 py-3 font-medium">Name</th>
                <th className="text-left px-6 py-3 font-medium">Email</th>
                <th className="text-left px-6 py-3 font-medium">Role</th>
                <th className="text-left px-6 py-3 font-medium">Joined</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {recentUsers.map((u: User) => (
                  <tr key={u.id} className="hover:bg-white/5">
                    <td className="px-6 py-3 text-white">{u.name || "—"}</td>
                    <td className="px-6 py-3 text-slate-300">{u.email || "—"}</td>
                    <td className="px-6 py-3"><span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{u.role}</span></td>
                    <td className="px-6 py-3 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
