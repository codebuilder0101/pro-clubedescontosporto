import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// One client per process. In development Next reloads modules on every edit,
// so the client is kept on globalThis to avoid exhausting connections.
const globalForDb = globalThis as unknown as { db?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  // Timestamps are stored without time zone and Prisma writes them in UTC, so
  // SQL's now() must be UTC too (the server's own zone is Europe/Lisbon).
  return new PrismaClient({ adapter: new PrismaPg({ connectionString, options: "-c TimeZone=UTC" }) });
}

export const db = globalForDb.db ?? createClient();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
