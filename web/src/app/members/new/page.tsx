import type { Metadata } from "next";
import { Suspense } from "react";
import { createMember } from "@/lib/actions/members";
import { requireUser } from "@/lib/auth/dal";
import { MemberForm } from "@/components/members/MemberForm";
import { FormSkeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Add member" };

export default function NewMemberPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <NewMember />
    </Suspense>
  );
}

async function NewMember() {
  await requireUser("/members/new");
  return <MemberForm action={createMember} />;
}
