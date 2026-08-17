import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import LongDocumentWorkspace from "@/components/LongDocumentWorkspace";

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user?.id) return { redirect: { destination: "/login", permanent: false } };
  const user = session.user as any;
  const documents = await prisma.document.findMany({ where: { userId: user.id, tenantId: user.tenantId, status: { not: "archived" } }, orderBy: { updatedAt: "desc" }, take: 100 });
  return { props: { initialDocuments: documents.map((doc: any) => ({ id: doc.id, title: doc.title, content: doc.content || "", type: doc.type, status: doc.status, tags: doc.tags || [], updatedAt: doc.updatedAt.toISOString() })) } };
}

export default function DocumentWorkspacePage({ initialDocuments }: any) {
  return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"><nav className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><a href="/dashboard" className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 text-white">▤</span><span className="font-semibold text-white">Full Document Workspace</span></a><div className="flex gap-4 text-sm text-slate-300"><a href="/documents">Documents</a><a href="/templates">Templates</a><a href="/image-gallery">Image Gallery</a><a href="/dashboard">Dashboard</a></div></div></nav><main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8"><LongDocumentWorkspace initialDocuments={initialDocuments} /></main></div>;
}
