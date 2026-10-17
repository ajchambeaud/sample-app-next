import Link from "next/link";
import type { Book } from "@/lib/types";
import { ImageBox } from "@/components/ui/ImagePlaceholder";
import { LoanBadge } from "./LoanBadge";

export function BookCard({ book }: { book: Book }) {
  return (
    <Link
      href={`/books/${book.id}`}
      className="block overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:shadow-md"
    >
      <ImageBox src={book.coverUrl} alt={book.title} fallback="No cover" className="aspect-[2/3]">
        <LoanBadge book={book} className="absolute left-2 top-2 z-10 shadow" />
      </ImageBox>
      <div className="p-3">
        <h3 className="line-clamp-2 font-semibold text-slate-900">{book.title}</h3>
        <p className="text-sm text-slate-600">{book.author}</p>
      </div>
    </Link>
  );
}
