import type { Book } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Small availability pill for book cards and rows. Renders nothing when the book is available. */
export function LoanBadge({ book, className }: { book: Book; className?: string }) {
  if (!book.activeLoan) return null;
  const overdue = book.activeLoan.overdue;
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium",
        overdue ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800",
        className
      )}
    >
      {overdue ? "Overdue" : "On loan"}
    </span>
  );
}
