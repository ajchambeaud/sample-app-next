import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteAuthor } from "@/lib/actions/authors";
import { getSessionUser } from "@/lib/auth/dal";
import { getAuthor } from "@/lib/data/authors";
import { BookCard } from "@/components/books/BookCard";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { ImageBox } from "@/components/ui/ImagePlaceholder";
import { DetailSkeleton } from "@/components/ui/Skeleton";
import { TagChip } from "@/components/ui/TagChip";
import { buttonClass } from "@/components/ui/styles";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const author = await getAuthor((await params).id);
  return { title: author ? author.name : "Author" };
}

export default function AuthorPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <AuthorDetail params={params} />
    </Suspense>
  );
}

async function AuthorDetail({ params }: { params: Params }) {
  const { id } = await params;
  const [author, user] = await Promise.all([getAuthor(id), getSessionUser()]);
  if (!author) notFound();
  const books = author.books ?? [];

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <ImageBox src={author.pictureUrl} alt={author.name} fallback="No picture" className="aspect-square rounded" />
        <div>
          <h1 className="text-2xl font-semibold">{author.name}</h1>
          {author.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {author.tags.map((tag) => (
                <TagChip key={tag.slug} tag={tag} basePath="/authors" />
              ))}
            </div>
          )}
          {author.bio && <p className="mt-4 whitespace-pre-wrap text-slate-800">{author.bio}</p>}
          {user && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href={`/authors/${author.id}/edit`} className={buttonClass("primary", "sm")}>
                Edit
              </Link>
              <ConfirmButton
                action={deleteAuthor.bind(null, author.id)}
                confirmText="Delete this author? Linked books keep their author name but lose the profile link."
              >
                Delete
              </ConfirmButton>
            </div>
          )}
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Books</h2>
      {books.length === 0 ? (
        <p className="text-slate-500">No books linked to this author yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {books.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}
    </div>
  );
}
