import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ContactDetailClient from "@/components/ContactDetailClient";

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user?.id) return { redirect: { destination: "/login", permanent: false } };

  const user = session.user as any;
  const { id, email } = context.query;

  return {
    props: {
      user: { name: user.name || "User", email: user.email || "", role: user.role, tenantSlug: user.tenantSlug || "" },
      contactId: id || null,
      contactEmail: email || null,
    },
  };
}

export default function ContactDetailPage({ user, contactId, contactEmail }: any) {
  return <ContactDetailClient user={user} contactId={contactId} contactEmail={contactEmail} />;
}
