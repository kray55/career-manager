import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import CRMResumesClient from "@/components/CRMResumesClient";

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user?.id) return { redirect: { destination: "/login", permanent: false } };

  const user = session.user as any;
  const resumes = await prisma.resume.findMany({
    where: { userId: user.id, tenantId: user.tenantId },
    orderBy: { updatedAt: "desc" },
    include: {
      history: {
        orderBy: { version: "desc" },
        select: { version: true, createdAt: true },
      },
    },
  });

  const serialized = resumes.map((r: any) => ({
    id: r.id,
    title: r.title,
    version: r.version,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    history: r.history.map((h: any) => ({
      version: h.version,
      createdAt: h.createdAt.toISOString(),
    })),
  }));

  return {
    props: {
      user: { name: user.name || "User", email: user.email || "", role: user.role },
      resumes: serialized,
    },
  };
}

export default function CRMResumesPage({ user, resumes }: any) {
  return <CRMResumesClient user={user} resumes={resumes} />;
}
