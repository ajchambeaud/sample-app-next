import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/dal";
import { isLoanFilter, listLoans, type LoanFilter } from "@/lib/data/loans";
import type { SearchParams } from "@/lib/search-params";
import { getString } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import { LoanTable } from "@/components/loans/LoanTable";
import { TableSkeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Loans" };

const FILTERS: { value: LoanFilter; label: string }[] = [
  { value: "active", label: "On loan" },
  { value: "overdue", label: "Overdue" },
  { value: "returned", label: "Returned" },
  { value: "all", label: "All" },
];

export default function LoansPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div>
      <Suspense fallback={<LoansFallback />}>
        <LoanList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function LoansFallback() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Loans</h1>
      <TableSkeleton />
    </>
  );
}

async function LoanList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireUser("/loans");
  const raw = getString(await searchParams, "status");
  const status: LoanFilter = isLoanFilter(raw) ? raw : "active";
  const { items: loans, total } = await listLoans({ status, limit: 100 });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Loans</h1>
        <div className="flex overflow-hidden rounded-lg border border-slate-200" role="group" aria-label="Filter loans">
          {FILTERS.map((f, i) => (
            <Link
              key={f.value}
              href={f.value === "active" ? "/loans" : `/loans?status=${f.value}`}
              aria-pressed={status === f.value}
              className={cn(
                "px-3 py-2 text-sm",
                i > 0 && "border-l border-slate-200",
                status === f.value ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>
      <LoanTable loans={loans} actions emptyMessage="No loans in this view." />
      {total > loans.length && (
        <p className="mt-2 text-sm text-slate-500">
          Showing the first {loans.length} of {total}.
        </p>
      )}
    </>
  );
}
