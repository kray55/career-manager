import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import LibraryView from "@/components/LibraryView";

export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user?.id) return { redirect: { destination: "/login", permanent: false } };

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return { props: { bookmarks: JSON.parse(JSON.stringify(bookmarks)) } };
}

export default function LibraryPage({ bookmarks }: any) {
  return <LibraryView bookmarks={bookmarks} />;
}
