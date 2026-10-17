import type { Metadata } from "next";
import { Suspense } from "react";
import { createAuthor } from "@/lib/actions/authors";
import { requireUser } from "@/lib/auth/dal";
import { AuthorForm } from "@/components/authors/AuthorForm";
import { FormSkeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Add author" };

export default function NewAuthorPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <NewAuthor />
    </Suspense>
  );
}

async function NewAuthor() {
  await requireUser("/authors/new");
  return <AuthorForm action={createAuthor} />;
}
