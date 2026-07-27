import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DocumentsPageClient from "@/components/DocumentsPageClient";

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user?.id) return { redirect: { destination: "/login", permanent: false } };

  const user = session.user as any;

  const documents = await prisma.document.findMany({
    where: { userId: user.id, status: { not: "archived" } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const docsData = documents.map(d => ({
    id: d.id,
    title: d.title,
    content: d.content,
    type: d.type,
    status: d.status,
    tags: d.tags,
    fileUrl: d.fileUrl,
    fileType: d.fileType,
    fileSize: d.fileSize,
    aiGenerated: d.aiGenerated,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));

  return {
    props: {
      user: { name: user.name || "User", email: user.email || "", role: user.role, tenantSlug: user.tenantSlug || "" },
      initialDocuments: docsData,
    },
  };
}

export default function DocumentsPage({ user, initialDocuments }: any) {
  return <DocumentsPageClient user={user} initialDocuments={initialDocuments} />;
}
