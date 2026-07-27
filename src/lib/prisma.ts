import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  // Multi-Tenant Middleware - injects tenantId from session
  client.$use(async (params, next) => {
    if (params.model === "Tenant") return next(params);

    const scoped = ["User", "Account", "Session", "Bookmark", "Note", "Document", "Resume", "ResumeHistory", "EmailLog", "ChatMessage", "Contact"];
    if (params.model && scoped.includes(params.model)) {
      try {
        // Dynamic import to avoid circular dependency
        const mod = await import("./auth");
        const { getServerSession } = await import("next-auth");
        // We pass empty req/res - tenantId injection will be most useful
        // when the session has already been established via API routes/SSR.
        // For background/prisma-studio usage, this gracefully degrades.
        const session = await getServerSession({ headers: {} } as any, {} as any, mod.authOptions);
        const tenantId = (session?.user as any)?.tenantId;
        if (tenantId) {
          if (params.action === "create") {
            params.args.data = { ...params.args.data, tenantId };
          } else if (!params.args?.where?.tenantId) {
            params.args = { ...params.args, where: { ...params.args?.where, tenantId } };
          }
        }
      } catch {
        // Silently skip if session unavailable (seed, studio, etc.)
      }
    }
    return next(params);
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export default prisma;
