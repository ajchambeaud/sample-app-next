import "server-only";
import { connection } from "next/server";
import { and, asc, count, desc, eq, inArray, like, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { presignGet } from "@/lib/storage";
import { slugify } from "@/lib/tags";
import type { Author, Page } from "@/lib/types";
import { PAGE_SIZE } from "@/lib/types";
import { bookWith, serializeBooks, type BookRow } from "./books";

const { authors, authorTags, tags, books } = schema;

type AuthorRow = typeof authors.$inferSelect & {
  authorTags: { tag: { slug: string; displayText: string } }[];
  books?: BookRow[];
};

const authorWith = {
  authorTags: { with: { tag: { columns: { slug: true, displayText: true } } } },
} as const;

export async function serializeAuthor(row: AuthorRow): Promise<Author> {
  return {
    id: row.id,
    name: row.name,
    bio: row.bio,
    pictureKey: row.pictureKey,
    pictureUrl: row.pictureKey ? await presignGet(row.pictureKey) : null,
    tags: row.authorTags.map((at) => at.tag),
    books: row.books ? await serializeBooks(row.books) : undefined,
    createdById: row.createdById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export interface AuthorQuery {
  q?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

export async function listAuthors(query: AuthorQuery = {}): Promise<Page<Author>> {
  // Fresh on every request: the data (and the presigned URLs / loan status
  // derived from the current time) must never end up in a prerendered shell.
  await connection();
  const q = query.q?.trim() ?? "";
  const tagSlug = query.tag ? slugify(query.tag) : "";
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(50, Math.max(1, query.limit ?? PAGE_SIZE));
  const db = getDb();

  const conditions: SQL[] = [];
  if (q) conditions.push(like(authors.name, `%${q}%`));
  if (tagSlug) {
    conditions.push(
      inArray(
        authors.id,
        db
          .select({ id: authorTags.authorId })
          .from(authorTags)
          .innerJoin(tags, eq(tags.id, authorTags.tagId))
          .where(eq(tags.slug, tagSlug))
      )
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.query.authors.findMany({ where, with: authorWith, orderBy: [asc(authors.name)], limit, offset: (page - 1) * limit }),
    db.select({ total: count() }).from(authors).where(where),
  ]);

  return { items: await Promise.all(rows.map(serializeAuthor)), page, limit, total };
}

/** Author profile including its linked books (with tags and availability). */
export async function getAuthor(id: string): Promise<Author | null> {
  // Fresh on every request: the data (and the presigned URLs / loan status
  // derived from the current time) must never end up in a prerendered shell.
  await connection();
  const row = await getDb().query.authors.findFirst({
    where: eq(authors.id, id),
    with: { ...authorWith, books: { with: bookWith, orderBy: [desc(books.createdAt)] } },
  });
  return row ? serializeAuthor(row) : null;
}

export function findAuthorRow(id: string) {
  return getDb().query.authors.findFirst({ where: eq(authors.id, id) });
}
