// ──────────────────────────────────────────────
// Reports Page (T14-C/D)
// Lists generated reports scoped to tenant
// ──────────────────────────────────────────────
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user?.id) return { redirect: { destination: "/login", permanent: false } };
  const user = session.user as any;

  const logs = await prisma.reportLog.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return {
    props: {
      reports: logs.map((r: any) => ({
        id: r.id,
        type: "GRANT_REPORT",
        grantName: r.grantName,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
    },
  };
}

export default function ReportsPage({ reports }: any) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-white font-semibold">Grant Reports</span>
          </div>
          <a href="/dashboard" className="text-sm text-slate-300 hover:text-white">Dashboard</a>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Report History</h1>
            <p className="text-sm text-slate-400 mt-1">GDPR-compliant audit trail of generated reports</p>
          </div>
          <a
            href="/budget"
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-lg text-sm font-medium"
          >
            Budget Dashboard
          </a>
        </div>

        {reports.length < 1 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-16 text-center">
            <p className="text-slate-500">No reports generated yet. Create budget entries first.</p>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5">
                  <th className="text-left p-3 text-slate-400">Report</th>
                  <th className="text-left p-3 text-slate-400">Grant</th>
                  <th className="text-left p-3 text-slate-400">Status</th>
                  <th className="text-left p-3 text-slate-400">Generated</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r: any) => (
                  <tr key={r.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="p-3">
                      <span className="text-white font-medium">{r.type.replace(/_/g, " ")}</span>
                    </td>
                    <td className="p-3 text-slate-400">{r.grantName || "General"}</td>
                    <td className="p-3">
                      <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
