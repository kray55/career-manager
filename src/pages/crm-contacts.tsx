import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import CRMContactsClient from "@/components/CRMContactsClient";

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user?.id) return { redirect: { destination: "/login", permanent: false } };
  const user = session.user as any;

  const contacts = await prisma.contact.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { updatedAt: "desc" },
  });

  const serialized = contacts.map((c: any) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    company: c.company,
    status: c.status,
    notes: c.notes,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return {
    props: {
      user: { name: user.name || "User", email: user.email || "", role: user.role, tenantSlug: user.tenantSlug || "" },
      contacts: serialized,
    },
  };
}

export default function CRMContactsPage({ user, contacts }: any) {
  return <CRMContactsClient user={user} initialContacts={contacts} />;
}
