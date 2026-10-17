import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getSessionUser } from "@/lib/auth/dal";
import { listAuthors } from "@/lib/data/authors";
import type { SearchParams } from "@/lib/search-params";
import { getPage, getString, hrefWithout, toURLSearchParams } from "@/lib/search-params";
import { PAGE_SIZE } from "@/lib/types";
import { AuthorCard } from "@/components/authors/AuthorCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { SearchBar } from "@/components/ui/SearchBar";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { ActiveTagFilter } from "@/components/ui/TagChip";
import { buttonClass } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Authors" };

export default function AuthorsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <Suspense fallback={<CardGridSkeleton aspect="aspect-square" />}>
      <AuthorList searchParams={searchParams} />
    </Suspense>
  );
}

async function AuthorList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = getString(sp, "q");
  const tag = getString(sp, "tag");
  const page = getPage(sp);

  const [{ items: authors, total }, user] = await Promise.all([
    listAuthors({ q, tag: tag || undefined, page, limit: PAGE_SIZE }),
    getSessionUser(),
  ]);
  const tagLabel = authors.flatMap((a) => a.tags).find((t) => t.slug === tag)?.displayText ?? tag;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1">
          <SearchBar placeholder="Search authors by name" />
        </div>
        {user && (
          <Link href="/authors/new" className={buttonClass("primary", "md")}>
            New author
          </Link>
        )}
      </div>
      {tag && <ActiveTagFilter label={tagLabel} clearHref={hrefWithout("/authors", sp, "tag", "page")} />}
      {authors.length === 0 ? (
        <EmptyState>{tag ? "No authors with this tag." : q ? "No authors match your search." : "No authors yet."}</EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {authors.map((a) => (
            <AuthorCard key={a.id} author={a} />
          ))}
        </div>
      )}
      <Pagination page={page} limit={PAGE_SIZE} total={total} pathname="/authors" params={toURLSearchParams(sp)} />
    </div>
  );
}
