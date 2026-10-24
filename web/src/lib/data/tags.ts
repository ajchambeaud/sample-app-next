import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { slugify } from "@/lib/tags";

/**
 * Resolve display texts into tag ids, creating missing tags. Tags are shared
 * globally and keyed by slug; on collision the existing displayText wins.
 */
export async function resolveTagIds(displayTexts: string[]): Promise<string[]> {
  const seen = new Map<string, string>();
  for (const raw of displayTexts) {
    const displayText = raw.trim();
    const slug = slugify(displayText);
    if (!displayText || !slug || seen.has(slug)) continue;
    seen.set(slug, displayText);
  }

  const db = getDb();
  const ids: string[] = [];
  for (const [slug, displayText] of seen) {
    const existing = await db.query.tags.findFirst({ where: eq(schema.tags.slug, slug), columns: { id: true } });
    if (existing) {
      ids.push(existing.id);
      continue;
    }
    const [created] = await db.insert(schema.tags).values({ slug, displayText }).returning({ id: schema.tags.id });
    ids.push(created.id);
  }
  return ids;
}

export async function setBookTags(bookId: string, displayTexts: string[]): Promise<void> {
  const tagIds = await resolveTagIds(displayTexts);
  const db = getDb();
  await db.delete(schema.bookTags).where(eq(schema.bookTags.bookId, bookId));
  if (tagIds.length) await db.insert(schema.bookTags).values(tagIds.map((tagId) => ({ bookId, tagId })));
}

export async function setAuthorTags(authorId: string, displayTexts: string[]): Promise<void> {
  const tagIds = await resolveTagIds(displayTexts);
  const db = getDb();
  await db.delete(schema.authorTags).where(eq(schema.authorTags.authorId, authorId));
  if (tagIds.length) await db.insert(schema.authorTags).values(tagIds.map((tagId) => ({ authorId, tagId })));
}
