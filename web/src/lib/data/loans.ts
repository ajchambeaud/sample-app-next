import "server-only";
import { connection } from "next/server";
import { and, asc, count, desc, eq, isNotNull, isNull, lt, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { Loan, LoanStatus, Page } from "@/lib/types";
import { DAY_MS } from "@/lib/utils";

const { loans, books, members } = schema;

export const loanWith = {
  book: { columns: { id: true, title: true, author: true } },
  member: { columns: { id: true, firstName: true, lastName: true, nationalId: true } },
} as const;

export type LoanRow = typeof loans.$inferSelect & {
  book: { id: string; title: string; author: string } | null;
  member: { id: string; firstName: string; lastName: string; nationalId: string } | null;
};

export function loanStatus(loan: { dueAt: Date; returnedAt: Date | null }, now = new Date()): LoanStatus {
  if (loan.returnedAt) return "returned";
  return loan.dueAt.getTime() < now.getTime() ? "overdue" : "active";
}

export function serializeLoan(row: LoanRow, now = new Date()): Loan {
  const status = loanStatus(row, now);
  return {
    id: row.id,
    bookId: row.bookId,
    memberId: row.memberId,
    loanedAt: row.loanedAt.toISOString(),
    dueAt: row.dueAt.toISOString(),
    returnedAt: row.returnedAt?.toISOString() ?? null,
    status,
    daysOverdue: status === "returned" ? null : Math.max(0, Math.floor((now.getTime() - row.dueAt.getTime()) / DAY_MS)),
    book: row.book,
    member: row.member,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type LoanFilter = LoanStatus | "all";
export const LOAN_FILTERS: readonly LoanFilter[] = ["active", "overdue", "returned", "all"];

export function isLoanFilter(value: unknown): value is LoanFilter {
  return typeof value === "string" && (LOAN_FILTERS as readonly string[]).includes(value);
}

function whereForStatus(status: LoanFilter, now: Date): SQL | undefined {
  switch (status) {
    case "active":
      return isNull(loans.returnedAt);
    case "overdue":
      return and(isNull(loans.returnedAt), lt(loans.dueAt, now));
    case "returned":
      return isNotNull(loans.returnedAt);
    default:
      return undefined;
  }
}

export interface LoanQuery {
  status?: LoanFilter;
  bookId?: string;
  memberId?: string;
  page?: number;
  limit?: number;
}

export async function listLoans(query: LoanQuery = {}): Promise<Page<Loan>> {
  // Fresh on every request: the data (and the presigned URLs / loan status
  // derived from the current time) must never end up in a prerendered shell.
  await connection();
  const status = query.status ?? "active";
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const now = new Date();
  const db = getDb();

  const conditions: SQL[] = [];
  const statusWhere = whereForStatus(status, now);
  if (statusWhere) conditions.push(statusWhere);
  if (query.bookId) conditions.push(eq(loans.bookId, query.bookId));
  if (query.memberId) conditions.push(eq(loans.memberId, query.memberId));
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.query.loans.findMany({
      where,
      with: loanWith,
      // Active loans: soonest due first. Returned: most recent first.
      orderBy: status === "returned" ? [desc(loans.returnedAt)] : [asc(loans.dueAt)],
      limit,
      offset: (page - 1) * limit,
    }),
    db.select({ total: count() }).from(loans).where(where),
  ]);
  return { items: rows.map((r) => serializeLoan(r, now)), page, limit, total };
}

export async function getLoan(id: string): Promise<Loan | null> {
  // Fresh on every request: the data (and the presigned URLs / loan status
  // derived from the current time) must never end up in a prerendered shell.
  await connection();
  const row = await getDb().query.loans.findFirst({ where: eq(loans.id, id), with: loanWith });
  return row ? serializeLoan(row) : null;
}

export async function findActiveLoanForBook(bookId: string) {
  return getDb().query.loans.findFirst({ where: and(eq(loans.bookId, bookId), isNull(loans.returnedAt)) });
}

export async function countActiveLoansForMember(memberId: string): Promise<number> {
  const [{ total }] = await getDb()
    .select({ total: count() })
    .from(loans)
    .where(and(eq(loans.memberId, memberId), isNull(loans.returnedAt)));
  return total;
}

// Re-exported so callers that only need the tables don't import the schema module.
export { books, members };
