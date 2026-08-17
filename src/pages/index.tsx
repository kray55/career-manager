import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";



export async function getServerSideProps(context: any) {
  
  const session = await getServerSession(context.req, context.res, authOptions);
  
  if (session) return { redirect: { destination: "/dashboard", permanent: false } };
  
  return { redirect: { destination: "/index.html", permanent: false } };
  
}



export default function HomePage() { return null; }





