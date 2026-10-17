"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/dal";
import { findAuthorRow } from "@/lib/data/authors";
import { setAuthorTags } from "@/lib/data/tags";
import { getDb, schema } from "@/lib/db";
import { deleteObjectQuietly } from "@/lib/storage";
import type { ActionState } from "@/lib/types";
import { authorSchema, firstIssue } from "@/lib/validation";
import { field, imageKey, list } from "./form";

function parseAuthorForm(formData: FormData) {
  return authorSchema.safeParse({
    name: field(formData, "name"),
    bio: field(formData, "bio"),
    tags: list(formData, "tags"),
    pictureKey: imageKey(formData, "pictureKey", "clearPicture"),
  });
}

function revalidateAuthor(id: string) {
  revalidatePath("/authors");
  revalidatePath(`/authors/${id}`);
  // Book pages link to the author profile by name.
  revalidatePath("/");
}

export async function createAuthor(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in" };

  const parsed = parseAuthorForm(formData);
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const input = parsed.data;

  const [author] = await getDb()
    .insert(schema.authors)
    .values({ name: input.name, bio: input.bio, pictureKey: input.pictureKey ?? null, createdById: user.id })
    .returning({ id: schema.authors.id });
  await setAuthorTags(author.id, input.tags);

  revalidateAuthor(author.id);
  redirect(`/authors/${author.id}`);
}

/** Inline creation from the book form's author picker. Returns the new profile. */
export async function quickCreateAuthor(name: string): Promise<{ id: string; name: string }> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 200) throw new Error("Invalid author name");

  const [author] = await getDb()
    .insert(schema.authors)
    .values({ name: trimmed, bio: "", createdById: user.id })
    .returning({ id: schema.authors.id, name: schema.authors.name });
  revalidatePath("/authors");
  return author;
}

export async function updateAuthor(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in" };

  const author = await findAuthorRow(id);
  if (!author) return { error: "Author not found" };

  const parsed = parseAuthorForm(formData);
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const input = parsed.data;

  if (input.pictureKey !== undefined && author.pictureKey && author.pictureKey !== input.pictureKey) {
    await deleteObjectQuietly(author.pictureKey);
  }

  await getDb()
    .update(schema.authors)
    .set({ name: input.name, bio: input.bio, ...(input.pictureKey !== undefined && { pictureKey: input.pictureKey }) })
    .where(eq(schema.authors.id, id));
  await setAuthorTags(id, input.tags);

  revalidateAuthor(id);
  redirect(`/authors/${id}`);
}

export async function deleteAuthor(id: string): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in" };

  const author = await findAuthorRow(id);
  if (!author) return { error: "Author not found" };

  const db = getDb();
  // Books keep their author name but lose the profile link.
  await db.update(schema.books).set({ authorId: null }).where(eq(schema.books.authorId, id));
  await db.delete(schema.authorTags).where(eq(schema.authorTags.authorId, id));
  await db.delete(schema.authors).where(eq(schema.authors.id, id));
  await deleteObjectQuietly(author.pictureKey);

  revalidateAuthor(id);
  redirect("/authors");
}
