"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list";

/** Search, availability filter and grid/list toggle for the catalog. All state lives in the URL. */
export function BookToolbar({ view, availableOnly }: { view: ViewMode; availableOnly: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function withParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "view") next.delete("page");
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="min-w-[12rem] flex-1">
        <SearchBar placeholder="Search by title, author, or ISBN" />
      </div>
      <label className="flex items-center gap-2 whitespace-nowrap text-sm text-slate-600">
        <input
          type="checkbox"
          checked={availableOnly}
          onChange={(e) => startTransition(() => router.replace(withParam("available", e.target.checked ? "true" : null), { scroll: false }))}
          className="rounded border-slate-300"
        />
        Available only
      </label>
      <div className="flex overflow-hidden rounded-lg border border-slate-200" role="group" aria-label="View mode">
        <ViewLink href={withParam("view", null)} active={view === "grid"}>
          Grid
        </ViewLink>
        <ViewLink href={withParam("view", "list")} active={view === "list"} className="border-l border-slate-200">
          List
        </ViewLink>
      </div>
    </div>
  );
}

function ViewLink({ href, active, className, children }: { href: string; active: boolean; className?: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      replace
      scroll={false}
      aria-pressed={active}
      className={cn("px-3 py-2 text-sm", active ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50", className)}
    >
      {children}
    </Link>
  );
}
