// ──────────────────────────────────────────────
// Budget & Cash Flow Page (T13-B)
// SSR page with income/expense form and 12-month
// Recharts AreaChart projecting cash flow.
// ──────────────────────────────────────────────
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import BudgetClient from "@/components/BudgetClient";

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user?.id) return { redirect: { destination: "/login", permanent: false } };
  const user = session.user as any;
  const tenantId = user.tenantId;

  const items = await prisma.budgetItem.findMany({
    where: { tenantId },
    orderBy: { month: "asc" },
  });

  return {
    props: {
      items: items.map((i: any) => ({
        id: i.id,
        type: i.type,
        amount: i.amount,
        month: i.month.toISOString(),
        category: i.category,
        note: i.note || "",
      })),
    },
  };
}

export default function BudgetPage({ items }: any) {
  return <BudgetClient initialItems={items} />;
}
