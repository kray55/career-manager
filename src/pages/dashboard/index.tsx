import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";

import prisma from "@/lib/prisma";

import DashboardView from "@/components/DashboardView";



export async function getServerSideProps(context: any) {
  
  const session = await getServerSession(context.req, context.res, authOptions);
  
  if (!session?.user?.id) return { redirect: { destination: "/login", permanent: false } };
  
  const user = session.user as any;
  
  const [bookmarkCount, noteCount, documentCount] = await Promise.all([
    
    prisma.bookmark.count({ where: { userId: user.id } }),
    
    prisma.note.count({ where: { userId: user.id } }),
    
    prisma.document.count({ where: { userId: user.id } }),
    
  ]);
  

  
  return {
    
    props: {
      
      user: { name: user.name || "User", email: user.email || "", role: user.role, totpEnabled: user.totpEnabled || false, tenantSlug: user.tenantSlug || "" },
      
      stats: { bookmarkCount, noteCount, documentCount, resumeCount: 0, contactCount: 0 },
      
    },
    
  };
  
}



export default function DashboardPage({ user, stats }: any) {
  
  return <DashboardView user={user} stats={stats} />;
  
}



















