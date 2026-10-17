"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/dal";
import { findBookRow } from "@/lib/data/books";
import { findActiveLoanForBook } from "@/lib/data/loans";
import { setBookTags } from "@/lib/data/tags";
import { getDb, schema } from "@/lib/db";
import { deleteObjectQuietly } from "@/lib/storage";
import type { ActionState } from "@/lib/types";
import { bookSchema, firstIssue } from "@/lib/validation";
import { field, imageKey, list, optional } from "./form";

function parseBookForm(formData: FormData) {
  return bookSchema.safeParse({
    title: field(formData, "title"),
    author: field(formData, "author"),
    description: field(formData, "description"),
    isbn: optional(formData, "isbn"),
    authorId: optional(formData, "authorId"),
    tags: list(formData, "tags"),
    coverKey: imageKey(formData, "coverKey", "clearCover"),
  });
}

function revalidateBook(bookId: string, authorIds: Array<string | null | undefined>) {
  revalidatePath("/");
  revalidatePath(`/books/${bookId}`);
  revalidatePath("/loans");
  for (const id of new Set(authorIds)) if (id) revalidatePath(`/authors/${id}`);
}

export async function createBook(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in" };

  const parsed = parseBookForm(formData);
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const input = parsed.data;

  const db = getDb();
  const [book] = await db
    .insert(schema.books)
    .values({
      title: input.title,
      author: input.author,
      description: input.description,
      isbn: input.isbn,
      coverKey: input.coverKey ?? null,
      authorId: input.authorId,
      ownerId: user.id,
    })
    .returning({ id: schema.books.id });
  await setBookTags(book.id, input.tags);

  revalidateBook(book.id, [input.authorId]);
  redirect(`/books/${book.id}`);
}

export async function updateBook(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in" };

  const book = await findBookRow(id);
  if (!book) return { error: "Book not found" };
  if (book.ownerId !== user.id) return { error: "Only the owner can edit this book" };

  const parsed = parseBookForm(formData);
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const input = parsed.data;

  // Cover replaced or cleared: drop the previous object.
  if (input.coverKey !== undefined && book.coverKey && book.coverKey !== input.coverKey) {
    await deleteObjectQuietly(book.coverKey);
  }

  await getDb()
    .update(schema.books)
    .set({
      title: input.title,
      author: input.author,
      description: input.description,
      isbn: input.isbn,
      authorId: input.authorId,
      ...(input.coverKey !== undefined && { coverKey: input.coverKey }),
    })
    .where(eq(schema.books.id, id));
  await setBookTags(id, input.tags);

  revalidateBook(id, [book.authorId, input.authorId]);
  redirect(`/books/${id}`);
}

export async function deleteBook(id: string): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in" };

  const book = await findBookRow(id);
  if (!book) return { error: "Book not found" };
  if (book.ownerId !== user.id) return { error: "Only the owner can delete this book" };
  if (await findActiveLoanForBook(id)) return { error: "Cannot delete a book that is currently lent out" };

  const db = getDb();
  await db.delete(schema.bookTags).where(eq(schema.bookTags.bookId, id));
  await db.delete(schema.books).where(eq(schema.books.id, id));
  await deleteObjectQuietly(book.coverKey);

  revalidateBook(id, [book.authorId]);
  redirect("/");
}
