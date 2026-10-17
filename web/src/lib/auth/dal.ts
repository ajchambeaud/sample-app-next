import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { SessionUser } from "@/lib/types";
import { readSessionUserId } from "./session";

/**
 * Data Access Layer entry point for the current user. Memoized per request so
 * layouts, pages and actions in the same render share one cookie read + lookup.
 * Returns a narrow DTO: never the password hash.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const userId = await readSessionUserId();
  if (!userId) return null;
  const user = await getDb().query.users.findFirst({
    where: eq(schema.users.id, userId),
    columns: { id: true, email: true, name: true },
  });
  return user ?? null;
});

/** Like getSessionUser but redirects anonymous visitors to the login page. */
export async function requireUser(next?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return user;
}
