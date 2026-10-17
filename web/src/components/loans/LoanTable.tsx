import Link from "next/link";
import type { Loan } from "@/lib/types";
import { formatDate, memberName } from "@/lib/utils";
import { ReturnLoanButton } from "./ReturnLoanButton";

interface LoanTableProps {
  loans: Loan[];
  /** Hide the column that is redundant in context (e.g. member on the member page). */
  hide?: "book" | "member";
  /** Show the "Mark returned" action column. */
  actions?: boolean;
  emptyMessage?: string;
}

const STATUS_STYLES: Record<Loan["status"], string> = {
  active: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-800",
  returned: "bg-slate-100 text-slate-700",
};

export function StatusPill({ loan }: { loan: Loan }) {
  const label = loan.status === "overdue" ? `Overdue (${loan.daysOverdue}d)` : loan.status === "active" ? "On loan" : "Returned";
  return <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[loan.status]}`}>{label}</span>;
}

export function LoanTable({ loans, hide, actions, emptyMessage = "No loans." }: LoanTableProps) {
  if (loans.length === 0) return <p className="text-slate-500">{emptyMessage}</p>;

  return (
    <div className="overflow-x-auto rounded border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            {hide !== "book" && <th className="px-4 py-2 font-medium">Book</th>}
            {hide !== "member" && <th className="px-4 py-2 font-medium">Member</th>}
            <th className="px-4 py-2 font-medium">Lent</th>
            <th className="px-4 py-2 font-medium">Due</th>
            <th className="px-4 py-2 font-medium">Status</th>
            {actions && <th className="px-4 py-2" />}
          </tr>
        </thead>
        <tbody>
          {loans.map((loan) => (
            <tr key={loan.id} className="border-b border-slate-100 last:border-b-0">
              {hide !== "book" && (
                <td className="px-4 py-2">
                  {loan.book ? (
                    <Link href={`/books/${loan.book.id}`} className="text-slate-900 hover:underline">
                      {loan.book.title}
                    </Link>
                  ) : (
                    <span className="text-slate-400">Deleted book</span>
                  )}
                </td>
              )}
              {hide !== "member" && (
                <td className="px-4 py-2">
                  {loan.member ? (
                    <Link href={`/members/${loan.member.id}`} className="text-slate-900 hover:underline">
                      {memberName(loan.member)}
                    </Link>
                  ) : (
                    <span className="text-slate-400">Deleted member</span>
                  )}
                </td>
              )}
              <td className="px-4 py-2 text-slate-700">{formatDate(loan.loanedAt)}</td>
              <td className="px-4 py-2 text-slate-700">{loan.returnedAt ? `Returned ${formatDate(loan.returnedAt)}` : formatDate(loan.dueAt)}</td>
              <td className="px-4 py-2">
                <StatusPill loan={loan} />
              </td>
              {actions && <td className="px-4 py-2 text-right">{!loan.returnedAt && <ReturnLoanButton loanId={loan.id} />}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
