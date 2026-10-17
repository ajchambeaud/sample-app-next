import { Suspense } from "react";
import { listBooks } from "@/lib/data/books";
import type { SearchParams } from "@/lib/search-params";
import { getBoolean, getPage, getString, hrefWithout, toURLSearchParams } from "@/lib/search-params";
import { PAGE_SIZE } from "@/lib/types";
import { BookCard } from "@/components/books/BookCard";
import { BookRow } from "@/components/books/BookRow";
import { BookToolbar, type ViewMode } from "@/components/books/BookToolbar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { ActiveTagFilter } from "@/components/ui/TagChip";

export default function BooksPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <Suspense fallback={<CardGridSkeleton />}>
      <BookList searchParams={searchParams} />
    </Suspense>
  );
}

async function BookList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = getString(sp, "q");
  const tag = getString(sp, "tag");
  const availableOnly = getBoolean(sp, "available");
  const view: ViewMode = getString(sp, "view") === "list" ? "list" : "grid";
  const page = getPage(sp);

  const result = await listBooks({ q, tag: tag || undefined, available: availableOnly, page, limit: PAGE_SIZE });
  const { items: books, total } = result;

  // Prefer a human-readable label for the active tag; fall back to the slug.
  const tagLabel = books.flatMap((b) => b.tags).find((t) => t.slug === tag)?.displayText ?? tag;

  return (
    <div>
      <BookToolbar view={view} availableOnly={availableOnly} />
      {tag && <ActiveTagFilter label={tagLabel} clearHref={hrefWithout("/", sp, "tag", "page")} />}
      {books.length === 0 ? (
        <EmptyState>{availableOnly ? "No available books." : tag ? "No books with this tag." : q ? "No books match your search." : "No books yet."}</EmptyState>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {books.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {books.map((b) => (
            <BookRow key={b.id} book={b} />
          ))}
        </div>
      )}
      <Pagination page={page} limit={PAGE_SIZE} total={total} pathname="/" params={toURLSearchParams(sp)} />
    </div>
  );
}
