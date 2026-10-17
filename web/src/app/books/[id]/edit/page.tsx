import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { updateBook } from "@/lib/actions/books";
import { requireUser } from "@/lib/auth/dal";
import { getBook } from "@/lib/data/books";
import { BookForm } from "@/components/books/BookForm";
import { FormSkeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Edit book" };

type Params = Promise<{ id: string }>;

export default function EditBookPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <EditBook params={params} />
    </Suspense>
  );
}

async function EditBook({ params }: { params: Params }) {
  const { id } = await params;
  const [user, book] = await Promise.all([requireUser(`/books/${id}/edit`), getBook(id)]);
  if (!book) notFound();
  // Only the owner may edit; everyone else is sent back to the book page.
  if (book.ownerId !== user.id) redirect(`/books/${id}`);
  return <BookForm book={book} action={updateBook.bind(null, id)} />;
}
