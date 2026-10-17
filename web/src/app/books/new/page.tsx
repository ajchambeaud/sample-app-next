import type { Metadata } from "next";
import { Suspense } from "react";
import { createBook } from "@/lib/actions/books";
import { requireUser } from "@/lib/auth/dal";
import { BookForm } from "@/components/books/BookForm";
import { FormSkeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Add book" };

export default function NewBookPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <NewBook />
    </Suspense>
  );
}

async function NewBook() {
  await requireUser("/books/new");
  return <BookForm action={createBook} />;
}
