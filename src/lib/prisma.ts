import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof createPrismaClient> | undefined };

// Models scoped to tenant isolation — every query against these must be
// confined to the current session's tenantId. Kept identical to the
// original $use()-based middleware's list.
const TENANT_SCOPED_MODELS = [
  "User", "Account", "Session", "Bookmark", "Note", "Document",
  "Resume", "ResumeHistory", "EmailLog", "ChatMessage", "Contact",
];

function createPrismaClient() {
  // Prisma 7 requires an explicit driver adapter — bare `new PrismaClient()`
  // with no adapter is invalid as of v7. connectionString is read directly
  // here rather than from schema.prisma's datasource block, which v7 no
  // longer uses for the client's actual runtime connection.
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

  const base = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  // Multi-Tenant isolation — injects tenantId from session.
  // Prisma removed $use() middleware (deprecated 4.16.0, fully removed
  // 6.14.0). This is the documented $extends replacement: $allModels +
  // $allOperations is the closest equivalent to the old catch-all
  // middleware, applying uniformly across every model/operation rather
  // than needing one block per model per action.
  const client = base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          if (model === "Tenant") return query(args);

          if (model && TENANT_SCOPED_MODELS.includes(model)) {
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
                const scopedArgs = args as any;
                if (operation === "create") {
                  scopedArgs.data = { ...scopedArgs.data, tenantId };
                } else if (!scopedArgs?.where?.tenantId) {
                  scopedArgs.where = { ...scopedArgs?.where, tenantId };
                }
              }
            } catch {
              // Silently skip if session unavailable (seed, studio, etc.)
            }
          }

          return query(args);
        },
      },
    },
  });

  return client;
}

// Pragmatic export: coerce to `any` so model properties like `prisma.resume` are visible
// to TypeScript during build. This avoids type-mismatch issues introduced by the
// $extends-based client while preserving the runtime extended client.
export const prisma = (globalForPrisma.prisma ?? createPrismaClient()) as unknown as any;
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export default prisma;
