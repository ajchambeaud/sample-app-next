import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { updateMember } from "@/lib/actions/members";
import { requireUser } from "@/lib/auth/dal";
import { getMember } from "@/lib/data/members";
import { MemberForm } from "@/components/members/MemberForm";
import { FormSkeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Edit member" };

type Params = Promise<{ id: string }>;

export default function EditMemberPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <EditMember params={params} />
    </Suspense>
  );
}

async function EditMember({ params }: { params: Params }) {
  const { id } = await params;
  const [, member] = await Promise.all([requireUser(`/members/${id}/edit`), getMember(id)]);
  if (!member) notFound();
  return <MemberForm member={member} action={updateMember.bind(null, id)} />;
}
