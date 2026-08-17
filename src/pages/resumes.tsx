import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ResumeEditorClient from "@/components/ResumeEditorClient";

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user?.id) return { redirect: { destination: "/login", permanent: false } };

  const user = session.user as any;
  const id = context.query.id as string;

  let resume = null;
  if (id) {
    resume = await prisma.resume.findFirst({
      where: { id, userId: user.id, tenantId: user.tenantId },
    });
    if (!resume) {
      const document = await prisma.document.findFirst({ where: { id, userId: user.id, tenantId: user.tenantId } });
      if (document) return { redirect: { destination: `/documents?id=${document.id}`, permanent: false } };
    }
  }

  return {
    props: {
      user: { name: user.name || "User", email: user.email || "", role: user.role },
      resume: resume
        ? { id: resume.id, title: resume.title, content: resume.content, version: resume.version }
        : null,
    },
  };
}

export default function ResumeEditorPage({ user, resume }: any) {
  return <ResumeEditorClient user={user} resume={resume} />;
}
