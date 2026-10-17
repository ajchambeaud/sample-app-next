import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteBook } from "@/lib/actions/books";
import { getSessionUser } from "@/lib/auth/dal";
import { getBook } from "@/lib/data/books";
import { getLoan } from "@/lib/data/loans";
import { LoanPanel } from "@/components/books/LoanPanel";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { ImageBox } from "@/components/ui/ImagePlaceholder";
import { DetailSkeleton } from "@/components/ui/Skeleton";
import { TagChip } from "@/components/ui/TagChip";
import { buttonClass } from "@/components/ui/styles";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const book = await getBook((await params).id);
  return { title: book ? book.title : "Book" };
}

export default function BookPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <BookDetail params={params} />
    </Suspense>
  );
}

async function BookDetail({ params }: { params: Params }) {
  const { id } = await params;
  const [book, user] = await Promise.all([getBook(id), getSessionUser()]);
  if (!book) notFound();

  // The public book payload omits the member; load the full loan for librarians.
  const loan = user && book.activeLoan ? await getLoan(book.activeLoan.id) : null;
  const isOwner = user?.id === book.ownerId;

  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <ImageBox src={book.coverUrl} alt={book.title} fallback="No cover" className="aspect-[2/3] rounded" />
      <div>
        <h1 className="text-2xl font-semibold">{book.title}</h1>
        <p className="mt-1 text-slate-600">
          {book.authorId ? (
            <Link href={`/authors/${book.authorId}`} className="hover:text-slate-900 hover:underline">
              {book.author}
            </Link>
          ) : (
            book.author
          )}
        </p>
        {book.isbn && <p className="mt-1 text-sm text-slate-500">ISBN: {book.isbn}</p>}
        {book.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {book.tags.map((tag) => (
              <TagChip key={tag.slug} tag={tag} basePath="/" />
            ))}
          </div>
        )}
        {book.description && <p className="mt-4 whitespace-pre-wrap text-slate-800">{book.description}</p>}

        <LoanPanel book={book} loan={loan} signedIn={Boolean(user)} />

        {isOwner && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href={`/books/${book.id}/edit`} className={buttonClass("primary", "sm")}>
              Edit
            </Link>
            <ConfirmButton action={deleteBook.bind(null, book.id)} confirmText="Delete this book?">
              Delete
            </ConfirmButton>
          </div>
        )}
      </div>
    </div>
  );
}
