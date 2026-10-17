import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteMember } from "@/lib/actions/members";
import { requireUser } from "@/lib/auth/dal";
import { listLoans } from "@/lib/data/loans";
import { getMember } from "@/lib/data/members";
import { formatDate } from "@/lib/utils";
import { LoanTable } from "@/components/loans/LoanTable";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { buttonClass } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Member" };

type Params = Promise<{ id: string }>;

export default function MemberPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <MemberDetail params={params} />
    </Suspense>
  );
}

async function MemberDetail({ params }: { params: Params }) {
  const { id } = await params;
  await requireUser(`/members/${id}`);
  const [member, { items: loans }] = await Promise.all([getMember(id), listLoans({ memberId: id, status: "all", limit: 100 })]);
  if (!member) notFound();

  const activeLoans = loans.filter((l) => !l.returnedAt);
  const pastLoans = loans.filter((l) => l.returnedAt);

  return (
    <div>
      <Link href="/members" className="text-sm text-slate-500 hover:text-slate-900">
        &larr; Back to members
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">
        {member.firstName} {member.lastName}
      </h1>
      <dl className="mt-6 max-w-md rounded border border-slate-200 bg-white">
        <Row label="National ID">{member.nationalId}</Row>
        <Row label="Email">{member.email}</Row>
        <Row label="Phone">{member.phone || "—"}</Row>
        <Row label="Member since" last>
          {formatDate(member.createdAt)}
        </Row>
      </dl>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Books on loan</h2>
        <div className="mt-3">
          <LoanTable loans={activeLoans} hide="member" actions emptyMessage="No books on loan." />
        </div>
      </section>
      {pastLoans.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">Loan history</h2>
          <div className="mt-3">
            <LoanTable loans={pastLoans} hide="member" />
          </div>
        </section>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link href={`/members/${member.id}/edit`} className={buttonClass("primary", "sm")}>
          Edit
        </Link>
        <ConfirmButton action={deleteMember.bind(null, member.id)} confirmText="Delete this member?">
          Delete
        </ConfirmButton>
      </div>
    </div>
  );
}

function Row({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 px-4 py-3 ${last ? "" : "border-b border-slate-100"}`}>
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-900">{children}</dd>
    </div>
  );
}
