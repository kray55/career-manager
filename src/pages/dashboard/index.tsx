import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DashboardView from "@/components/DashboardView";

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user?.id) return { redirect: { destination: "/login", permanent: false } };
  const user = session.user as any;
  const [bookmarkCount, noteCount, documentCount, resumeCount, contactCount] = await Promise.all([
    prisma.bookmark.count({ where: { userId: user.id } }),
    prisma.note.count({ where: { userId: user.id } }),
    prisma.document.count({ where: { userId: user.id } }),
    prisma.resume.count({ where: { userId: user.id } }),
    prisma.contact.count({ where: { tenantId: user.tenantId } }),
  ]);

  return {
    props: {
      user: { name: user.name || "User", email: user.email || "", role: user.role, totpEnabled: user.totpEnabled || false, tenantSlug: user.tenantSlug || "" },
      stats: { bookmarkCount, noteCount, documentCount, resumeCount, contactCount },
    },
  };
}

export default function DashboardPage({ user, stats }: any) {
  return <DashboardView user={user} stats={stats} />;
}
