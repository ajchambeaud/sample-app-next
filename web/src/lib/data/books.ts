import "server-only";
import { connection } from "next/server";
import { and, count, desc, eq, inArray, isNull, like, notExists, or, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { presignGet } from "@/lib/storage";
import { slugify } from "@/lib/tags";
import type { Book, Page, Tag } from "@/lib/types";
import { PAGE_SIZE } from "@/lib/types";

const { books, bookTags, tags, loans } = schema;

// Row shape produced by the relational queries below.
export type BookRow = typeof books.$inferSelect & {
  bookTags: { tag: { slug: string; displayText: string } }[];
  loans: { id: string; loanedAt: Date; dueAt: Date; returnedAt: Date | null }[];
};

// Loads tags plus the unreturned loan (if any) alongside a book.
export const bookWith = {
  bookTags: { with: { tag: { columns: { slug: true, displayText: true } } } },
  loans: {
    where: isNull(loans.returnedAt),
    columns: { id: true, loanedAt: true, dueAt: true, returnedAt: true },
  },
} as const;

export async function serializeBook(row: BookRow, now = new Date()): Promise<Book> {
  const loan = row.loans.find((l) => l.returnedAt === null) ?? null;
  const tagList: Tag[] = row.bookTags.map((bt) => bt.tag);
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    description: row.description,
    isbn: row.isbn,
    coverKey: row.coverKey,
    coverUrl: row.coverKey ? await presignGet(row.coverKey) : null,
    ownerId: row.ownerId,
    authorId: row.authorId,
    tags: tagList,
    available: loan === null,
    activeLoan: loan
      ? {
          id: loan.id,
          loanedAt: loan.loanedAt.toISOString(),
          dueAt: loan.dueAt.toISOString(),
          overdue: loan.dueAt.getTime() < now.getTime(),
        }
      : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function serializeBooks(rows: BookRow[]): Promise<Book[]> {
  const now = new Date();
  return Promise.all(rows.map((r) => serializeBook(r, now)));
}

export interface BookQuery {
  q?: string;
  tag?: string;
  available?: boolean;
  page?: number;
  limit?: number;
}

export async function listBooks(query: BookQuery = {}): Promise<Page<Book>> {
  // Fresh on every request: the data (and the presigned URLs / loan status
  // derived from the current time) must never end up in a prerendered shell.
  await connection();
  const q = query.q?.trim() ?? "";
  const tagSlug = query.tag ? slugify(query.tag) : "";
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(50, Math.max(1, query.limit ?? PAGE_SIZE));
  const db = getDb();

  const conditions: SQL[] = [];
  if (q) {
    const pattern = `%${q}%`;
    conditions.push(or(like(books.title, pattern), like(books.author, pattern), like(books.isbn, pattern))!);
  }
  if (query.available) {
    // Hide books that currently have an unreturned loan.
    conditions.push(
      notExists(
        db
          .select({ id: loans.id })
          .from(loans)
          .where(and(eq(loans.bookId, books.id), isNull(loans.returnedAt)))
      )
    );
  }
  if (tagSlug) {
    conditions.push(
      inArray(
        books.id,
        db
          .select({ id: bookTags.bookId })
          .from(bookTags)
          .innerJoin(tags, eq(tags.id, bookTags.tagId))
          .where(eq(tags.slug, tagSlug))
      )
    );
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const [rows, [{ total }]] = await Promise.all([
    db.query.books.findMany({
      where,
      with: bookWith,
      orderBy: [desc(books.createdAt)],
      limit,
      offset: (page - 1) * limit,
    }),
    db.select({ total: count() }).from(books).where(where),
  ]);

  return { items: await serializeBooks(rows), page, limit, total };
}

export async function getBook(id: string): Promise<Book | null> {
  // Fresh on every request: the data (and the presigned URLs / loan status
  // derived from the current time) must never end up in a prerendered shell.
  await connection();
  const row = await getDb().query.books.findFirst({ where: eq(books.id, id), with: bookWith });
  return row ? serializeBook(row) : null;
}

/** Raw row without presigned URLs, for ownership checks in actions. */
export function findBookRow(id: string) {
  return getDb().query.books.findFirst({ where: eq(books.id, id) });
}
