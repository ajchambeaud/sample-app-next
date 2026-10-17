import Link from "next/link";
import { buttonClass } from "./styles";

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  pathname: string;
  /** Current query, preserved across page changes. */
  params: URLSearchParams;
}

/** Previous/next pager with a "showing X–Y of Z" summary. Renders nothing when everything fits on one page. */
export function Pagination({ page, limit, total, pathname, params }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  function href(target: number) {
    const next = new URLSearchParams(params);
    if (target <= 1) next.delete("page");
    else next.set("page", String(target));
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const disabled = buttonClass("secondary", "sm", "pointer-events-none opacity-50");
  return (
    <nav className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600" aria-label="Pagination">
      <span>
        Showing {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={buttonClass("secondary", "sm")}>
            Previous
          </Link>
        ) : (
          <span className={disabled}>Previous</span>
        )}
        <span className="whitespace-nowrap">
          Page {page} of {pages}
        </span>
        {page < pages ? (
          <Link href={href(page + 1)} className={buttonClass("secondary", "sm")}>
            Next
          </Link>
        ) : (
          <span className={disabled}>Next</span>
        )}
      </div>
    </nav>
  );
}
