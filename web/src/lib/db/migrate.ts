import "server-only";
import fs from "node:fs";
import path from "node:path";
import { migrate } from "drizzle-orm/libsql/migrator";
import { env } from "@/lib/env";
import { getDb } from "./index";

/**
 * Applies pending SQL migrations from ./drizzle. Runs once at server start
 * (see src/instrumentation.ts). Migrations are generated with `npm run db:generate`.
 */
export async function runMigrations() {
  if (env.databaseUrl.startsWith("file:")) {
    const file = env.databaseUrl.slice("file:".length);
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  }
  await migrate(getDb(), { migrationsFolder: path.join(process.cwd(), "drizzle") });
}
