import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TemplatesPageClient from "@/components/TemplatesPageClient";

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user?.id) return { redirect: { destination: "/login", permanent: false } };

  const user = session.user as any;
  
  return {
    props: {
      user: { name: user.name || "User", email: user.email || "", role: user.role, tenantSlug: user.tenantSlug || "" },
    },
  };
}

export default function TemplatesPage({ user }: any) {
  return <TemplatesPageClient user={user} />;
}
