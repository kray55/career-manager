import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ImageGalleryClient from "@/components/ImageGalleryClient";

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user?.id) return { redirect: { destination: "/login", permanent: false } };
  return { props: {} };
}

export default function ImageGalleryPage() {
  return <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"><nav className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><a href="/dashboard" className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 text-white">▧</span><span className="font-semibold text-white">Image Gallery</span></a><div className="flex gap-4 text-sm text-slate-300"><a href="/documents">Documents</a><a href="/templates">Templates</a><a href="/dashboard">Dashboard</a></div></div></nav><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><ImageGalleryClient /></main></div>;
}
