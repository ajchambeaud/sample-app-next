import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/dal";
import { listMembers } from "@/lib/data/members";
import type { SearchParams } from "@/lib/search-params";
import { getPage, getString, toURLSearchParams } from "@/lib/search-params";
import { PAGE_SIZE } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { SearchBar } from "@/components/ui/SearchBar";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { buttonClass } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Members" };

export default function MembersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <MemberList searchParams={searchParams} />
    </Suspense>
  );
}

async function MemberList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireUser("/members");
  const sp = await searchParams;
  const q = getString(sp, "q");
  const page = getPage(sp);
  const { items: members, total } = await listMembers({ q, page, limit: PAGE_SIZE });

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1">
          <SearchBar placeholder="Search members by name, national id or email" />
        </div>
        <Link href="/members/new" className={buttonClass("primary", "md")}>
          New member
        </Link>
      </div>
      {members.length === 0 ? (
        <EmptyState>{q ? "No members match your search." : "No members yet."}</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">National ID</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Phone</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-900">
                    <Link href={`/members/${m.id}`} className="block font-medium hover:underline">
                      {m.lastName}, {m.firstName}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-700">{m.nationalId}</td>
                  <td className="px-4 py-2 text-slate-700">{m.email}</td>
                  <td className="px-4 py-2 text-slate-700">{m.phone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} limit={PAGE_SIZE} total={total} pathname="/members" params={toURLSearchParams(sp)} />
    </div>
  );
}
