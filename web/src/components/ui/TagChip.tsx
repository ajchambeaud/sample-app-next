import Link from "next/link";
import type { Tag } from "@/lib/types";

/** Clickable tag that filters the given listing. */
export function TagChip({ tag, basePath }: { tag: Tag; basePath: string }) {
  return (
    <Link
      href={`${basePath}?tag=${encodeURIComponent(tag.slug)}`}
      className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-sm text-slate-700 hover:bg-slate-200"
    >
      {tag.displayText}
    </Link>
  );
}

/** "Filtered by tag: X ×" banner shown above a filtered listing. */
export function ActiveTagFilter({ label, clearHref }: { label: string; clearHref: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 text-sm">
      <span className="text-slate-500">Filtered by tag:</span>
      <span className="inline-flex items-center gap-1 rounded bg-slate-900 px-2 py-0.5 text-white">
        {label}
        <Link href={clearHref} aria-label="Clear tag filter" className="text-slate-300 hover:text-white">
          ×
        </Link>
      </span>
    </div>
  );
}
