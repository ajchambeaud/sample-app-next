import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { updateAuthor } from "@/lib/actions/authors";
import { requireUser } from "@/lib/auth/dal";
import { getAuthor } from "@/lib/data/authors";
import { AuthorForm } from "@/components/authors/AuthorForm";
import { FormSkeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Edit author" };

type Params = Promise<{ id: string }>;

export default function EditAuthorPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <EditAuthor params={params} />
    </Suspense>
  );
}

async function EditAuthor({ params }: { params: Params }) {
  const { id } = await params;
  const [, author] = await Promise.all([requireUser(`/authors/${id}/edit`), getAuthor(id)]);
  if (!author) notFound();
  return <AuthorForm author={author} action={updateAuthor.bind(null, id)} />;
}
