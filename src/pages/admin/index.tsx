import { getServerSession } from "next-auth";
import { authOptions, hasRole } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AdminView from "@/components/AdminView";

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user?.id || !hasRole((session.user as any)?.role, ["ADMIN", "SUPER_ADMIN"])) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }

  const [userCount, bookmarkCount, tenantCount] = await Promise.all([
    prisma.user.count(),
    prisma.bookmark.count(),
    prisma.tenant.count(),
  ]);

  const recentUsers = await prisma.user.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return { props: { stats: { userCount, bookmarkCount, tenantCount }, recentUsers: JSON.parse(JSON.stringify(recentUsers)) } };
}

export default function AdminPage({ stats, recentUsers }: any) {
  return <AdminView stats={stats} recentUsers={recentUsers} />;
}
