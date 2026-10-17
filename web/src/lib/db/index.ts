import "server-only";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { env } from "@/lib/env";
import * as schema from "./schema";

export type Db = LibSQLDatabase<typeof schema>;

// One client per process. The global keeps it stable across hot reloads in dev.
const globalForDb = globalThis as unknown as { __coolLibraryDb?: { client: Client; db: Db } };

function create() {
  const client = createClient({ url: env.databaseUrl });
  return { client, db: drizzle(client, { schema }) };
}

/** Lazily opens the SQLite database, so importing this module has no side effects at build time. */
export function getDb(): Db {
  if (!globalForDb.__coolLibraryDb) globalForDb.__coolLibraryDb = create();
  return globalForDb.__coolLibraryDb.db;
}

export { schema };
