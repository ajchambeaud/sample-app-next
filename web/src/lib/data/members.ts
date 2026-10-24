import "server-only";
import { connection } from "next/server";
import { asc, count, eq, like, or, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { Member, Page } from "@/lib/types";
import { PAGE_SIZE } from "@/lib/types";

const { members } = schema;

export function serializeMember(row: typeof members.$inferSelect): Member {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

export interface MemberQuery {
  q?: string;
  page?: number;
  limit?: number;
}

export async function listMembers(query: MemberQuery = {}): Promise<Page<Member>> {
  // Fresh on every request: the data (and the presigned URLs / loan status
  // derived from the current time) must never end up in a prerendered shell.
  await connection();
  const q = query.q?.trim() ?? "";
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(50, Math.max(1, query.limit ?? PAGE_SIZE));
  const db = getDb();

  let where: SQL | undefined;
  if (q) {
    const pattern = `%${q}%`;
    where = or(
      like(members.firstName, pattern),
      like(members.lastName, pattern),
      like(members.nationalId, pattern),
      like(members.email, pattern)
    );
  }

  const [rows, [{ total }]] = await Promise.all([
    db.query.members.findMany({
      where,
      orderBy: [asc(members.lastName), asc(members.firstName)],
      limit,
      offset: (page - 1) * limit,
    }),
    db.select({ total: count() }).from(members).where(where),
  ]);
  return { items: rows.map(serializeMember), page, limit, total };
}

export async function getMember(id: string): Promise<Member | null> {
  // Fresh on every request: the data (and the presigned URLs / loan status
  // derived from the current time) must never end up in a prerendered shell.
  await connection();
  const row = await getDb().query.members.findFirst({ where: eq(members.id, id) });
  return row ? serializeMember(row) : null;
}
