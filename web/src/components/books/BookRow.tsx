import Link from "next/link";
import type { Book } from "@/lib/types";
import { ImageBox } from "@/components/ui/ImagePlaceholder";
import { LoanBadge } from "./LoanBadge";

export function BookRow({ book }: { book: Book }) {
  return (
    <Link
      href={`/books/${book.id}`}
      className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-3 py-2 transition hover:shadow-md"
    >
      <ImageBox src={book.coverUrl} alt={book.title} fallback="—" className="h-14 w-10 flex-shrink-0 rounded" />
      <h3 className="min-w-0 flex-1 truncate font-semibold text-slate-900">{book.title}</h3>
      <LoanBadge book={book} />
      <p className="max-w-[40%] flex-shrink-0 truncate text-sm text-slate-600">{book.author}</p>
    </Link>
  );
}
