import NextAuth, { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        try {
          const user = await prisma.user.findUnique({
            where: { email },
            include: { tenant: true },
          });
          if (!user || !user.passwordHash) return null;

          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) return null;

          if (user.totpEnabled) {
            const totpCode = (credentials as any)?.totpCode as string | undefined;
            if (!totpCode) {
              return { id: user.id, email: user.email, name: user.name, tenantId: user.tenantId, tenantSlug: user.tenant.slug, role: user.role, mfaRequired: true } as any;
            }
            const { authenticator } = require("otplib");
            if (user.totpSecret) {
              authenticator.options = { window: 1 };
              if (!authenticator.check(totpCode, user.totpSecret)) return null;
            }
          }

          return { id: user.id, email: user.email, name: user.name, image: user.image, tenantId: user.tenantId, tenantSlug: user.tenant.slug, role: user.role, totpEnabled: user.totpEnabled, mfaRequired: false } as any;
        } catch { return null; }
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      const appUrl = process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://career-manager-iota.vercel.app";
      if (url.startsWith("/")) return `${appUrl}${url}`;
      try {
        const requested = new URL(url);
        const allowed = new URL(appUrl);
        if (requested.origin === allowed.origin) return url;
      } catch { /* fall through to the stable public app URL */ }
      return `${appUrl}/login`;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        (token as any).tenantId = (user as any).tenantId;
        (token as any).tenantSlug = (user as any).tenantSlug;
        (token as any).role = (user as any).role;
        (token as any).totpEnabled = (user as any).totpEnabled;
        (token as any).mfaRequired = (user as any).mfaRequired;
      }
      if (trigger === "update" && session) {
        const s = session as any;
        if (s.mfaVerified) { (token as any).mfaRequired = false; (token as any).mfaVerified = true; }
        if (s.totpEnabled !== undefined) (token as any).totpEnabled = s.totpEnabled;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).tenantId = (token as any).tenantId;
        (session.user as any).tenantSlug = (token as any).tenantSlug;
        (session.user as any).role = (token as any).role;
        (session.user as any).totpEnabled = (token as any).totpEnabled;
        (session.user as any).mfaRequired = (token as any).mfaRequired;
        (session.user as any).mfaVerified = (token as any).mfaVerified;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export default handler;

export function hasRole(userRole: string | undefined, requiredRoles: string[]): boolean {
  if (!userRole) return false;
  if (userRole === "SUPER_ADMIN") return true;
  return requiredRoles.includes(userRole);
}
