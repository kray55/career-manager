import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import NotesPageClient from "@/components/NotesPageClient";

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user?.id) return { redirect: { destination: "/login", permanent: false } };

  const user = session.user as any;
  const notes = await prisma.note.findMany({
    where: { userId: user.id, tenantId: user.tenantId, archived: false },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    take: 100,
  });

  const notesData = notes.map((n: any) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    tags: n.tags,
    jobUrl: n.jobUrl,
    pinned: n.pinned,
    archived: n.archived,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  }));

  return {
    props: {
      user: { name: user.name || "User", email: user.email || "", role: user.role, tenantSlug: user.tenantSlug || "" },
      initialNotes: notesData,
    },
  };
}

export default function NotesPage({ user, initialNotes }: any) {
  return <NotesPageClient user={user} initialNotes={initialNotes} />;
}
