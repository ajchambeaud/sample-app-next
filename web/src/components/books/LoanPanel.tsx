"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { extendLoan, lendBook, returnLoan } from "@/lib/actions/loans";
import type { ActionState, Book, Loan } from "@/lib/types";
import { DEFAULT_LOAN_DAYS, MAX_LOAN_DAYS } from "@/lib/types";
import { cn, DAY_MS, formatDate, memberName } from "@/lib/utils";
import { MemberSelect, type MemberOption } from "@/components/members/MemberSelect";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { buttonClass, inputClass } from "@/components/ui/styles";

interface LoanPanelProps {
  book: Book;
  /** Full loan record (with member) – only provided to signed-in users. */
  loan: Loan | null;
  signedIn: boolean;
}

/**
 * Availability box on the book page. Everyone sees whether the book is
 * available and, if not, until when. Signed-in users (librarians) can lend it
 * to a member, extend the loan, or mark it returned.
 */
export function LoanPanel({ book, loan, signedIn }: LoanPanelProps) {
  const overdue = book.activeLoan?.overdue ?? false;
  return (
    <section
      className={cn(
        "mt-6 rounded border p-4",
        !book.activeLoan ? "border-green-200 bg-green-50" : overdue ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
      )}
    >
      {!book.activeLoan ? (
        <>
          <p className="font-medium text-green-800">Available</p>
          {signedIn && <LendForm bookId={book.id} />}
        </>
      ) : (
        <>
          <p className={cn("font-medium", overdue ? "text-red-800" : "text-amber-800")}>
            {overdue ? "Overdue" : "On loan"} · due {formatDate(book.activeLoan.dueAt)}
          </p>
          <p className="mt-1 text-sm text-slate-600">Lent on {formatDate(book.activeLoan.loanedAt)}</p>
          {signedIn && loan && (
            <p className="mt-1 text-sm text-slate-700">
              Borrowed by{" "}
              <Link href={`/members/${loan.memberId}`} className="font-medium hover:underline">
                {memberName(loan.member)}
              </Link>
              {loan.daysOverdue ? <span className="text-red-700"> · {loan.daysOverdue} days late</span> : null}
            </p>
          )}
          {signedIn && <ActiveLoanActions loanId={book.activeLoan.id} />}
        </>
      )}
    </section>
  );
}

function LendForm({ bookId }: { bookId: string }) {
  const [member, setMember] = useState<MemberOption | null>(null);
  const [days, setDays] = useState(DEFAULT_LOAN_DAYS);
  const [now] = useState(() => Date.now());
  const [state, formAction] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await lendBook(prev, formData);
      // Reset the picker after a successful lend (the panel re-renders as "on loan").
      if (!result.error) setMember(null);
      return result;
    },
    { error: null } as ActionState
  );

  const validDays = days >= 1 && days <= MAX_LOAN_DAYS;
  return (
    <form action={formAction} className="mt-3 space-y-3">
      <input type="hidden" name="bookId" value={bookId} />
      <div>
        <label className="block text-sm font-medium text-slate-700">Lend to member</label>
        <MemberSelect value={member} onChange={setMember} />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Days</span>
          <input
            type="number"
            name="days"
            min={1}
            max={MAX_LOAN_DAYS}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className={inputClass + " w-24"}
          />
        </label>
        <p className="pb-2 text-sm text-slate-600">Due {new Date(now + days * DAY_MS).toLocaleDateString()}</p>
        <SubmitButton pendingText="Lending…" disabled={!member || !validDays} className="px-3 py-2">
          Lend book
        </SubmitButton>
      </div>
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
    </form>
  );
}

function ActiveLoanActions({ loanId }: { loanId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ error: string | null }>) {
    startTransition(async () => {
      setError(null);
      const result = await action();
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => run(() => returnLoan(loanId))} className={buttonClass("primary", "sm")}>
          Mark returned
        </button>
        <button type="button" disabled={pending} onClick={() => run(() => extendLoan(loanId, 7))} className={buttonClass("secondary", "sm")}>
          Extend 7 days
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
