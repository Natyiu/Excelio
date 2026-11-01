import { PrismaPg } from "@prisma/adapter-pg";

import { Prisma, PrismaClient } from "../prisma/generated/client";

function resolveConnectionString(): string {
  // The app talks to the database through the pooled URL; DIRECT_URL is for migrations
  // (prisma.config.ts) and is only used here when no pooled URL is set.
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.DIRECT_URL,
    process.env.POSTGRES_URL_NON_POOLING,
  ];

  for (const value of candidates) {
    const url = value?.trim();
    if (!url) continue;
    if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
      return url;
    }
  }

  throw new Error(
    "No valid Postgres connection string found. Set DIRECT_URL, POSTGRES_URL_NON_POOLING, DATABASE_URL, or POSTGRES_URL to a postgres:// URL.",
  );
}

// Supabase's session pooler allows only a handful of clients (15 on this plan), so
// keep each process's pool small and requests will queue rather than fail. On Vercel
// every request can start a new instance, so each one holds a single connection.
const POOL_MAX = Number(process.env.DATABASE_POOL_MAX ?? (process.env.VERCEL ? 1 : 5));

function createClient() {
  const adapter = new PrismaPg({ connectionString: resolveConnectionString(), max: POOL_MAX });
  return new PrismaClient({ adapter });
}

// In development, hot reloads re-run this module. Reuse one client across reloads
// instead of opening a new connection pool each time, which exhausts the pooler.
const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };
const prisma = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
export { Prisma };
