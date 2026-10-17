"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";
import type { ActionState } from "@/lib/types";
import { DAY_MS } from "@/lib/utils";
import { firstIssue, lendSchema, loanDaysSchema } from "@/lib/validation";
import { field } from "./form";

const { loans, books, members } = schema;

function revalidateLoan(loan: { bookId: string; memberId: string }, authorId?: string | null) {
  revalidatePath("/");
  revalidatePath(`/books/${loan.bookId}`);
  revalidatePath(`/members/${loan.memberId}`);
  revalidatePath("/loans");
  if (authorId) revalidatePath(`/authors/${authorId}`);
}

/**
 * Lend a book to a member. The existence checks and the insert run in one
 * transaction; the partial unique index on loans is the last line of defense.
 */
export async function lendBook(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { error: "You must be signed in" };

  const parsed = lendSchema.safeParse({
    bookId: field(formData, "bookId"),
    memberId: field(formData, "memberId"),
    days: field(formData, "days"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const input = parsed.data;

  const db = getDb();
  let authorId: string | null = null;
  try {
    await db.transaction(async (tx) => {
      const [book, member, existing] = await Promise.all([
        tx.query.books.findFirst({ where: eq(books.id, input.bookId), columns: { id: true, authorId: true } }),
        tx.query.members.findFirst({ where: eq(members.id, input.memberId), columns: { id: true } }),
        tx.query.loans.findFirst({ where: and(eq(loans.bookId, input.bookId), isNull(loans.returnedAt)) }),
      ]);
      if (!book) throw new LoanError("That book no longer exists.");
      if (!member) throw new LoanError("That member no longer exists.");
      if (existing) throw new LoanError("This book is already lent out.");
      authorId = book.authorId;

      const loanedAt = new Date();
      await tx.insert(loans).values({
        bookId: book.id,
        memberId: member.id,
        createdById: user.id,
        loanedAt,
        dueAt: new Date(loanedAt.getTime() + input.days * DAY_MS),
        returnedAt: null,
      });
    });
  } catch (err) {
    if (err instanceof LoanError) return { error: err.message };
    if (err instanceof Error && /UNIQUE constraint failed/i.test(err.message)) {
      return { error: "This book is already lent out." };
    }
    throw err;
  }

  revalidateLoan(input, authorId);
  return { error: null };
}

export async function returnLoan(id: string): Promise<ActionState> {
  if (!(await getSessionUser())) return { error: "You must be signed in" };

  const db = getDb();
  const loan = await db.query.loans.findFirst({ where: eq(loans.id, id), with: { book: { columns: { authorId: true } } } });
  if (!loan) return { error: "Loan not found" };
  if (loan.returnedAt) return { error: "This loan was already returned." };

  await db.update(loans).set({ returnedAt: new Date() }).where(eq(loans.id, id));
  revalidateLoan(loan, loan.book?.authorId);
  return { error: null };
}

/** Extend an active loan by `days` from its current due date. */
export async function extendLoan(id: string, days: number): Promise<ActionState> {
  if (!(await getSessionUser())) return { error: "You must be signed in" };
  const parsedDays = loanDaysSchema.safeParse(days);
  if (!parsedDays.success) return { error: "Invalid number of days" };

  const db = getDb();
  const loan = await db.query.loans.findFirst({ where: eq(loans.id, id), with: { book: { columns: { authorId: true } } } });
  if (!loan) return { error: "Loan not found" };
  if (loan.returnedAt) return { error: "This loan was already returned." };

  await db
    .update(loans)
    .set({ dueAt: new Date(loan.dueAt.getTime() + parsedDays.data * DAY_MS) })
    .where(eq(loans.id, id));
  revalidateLoan(loan, loan.book?.authorId);
  return { error: null };
}

class LoanError extends Error {}
