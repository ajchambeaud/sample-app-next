import Link from "next/link";
import type { Author } from "@/lib/types";
import { ImageBox } from "@/components/ui/ImagePlaceholder";

export function AuthorCard({ author }: { author: Author }) {
  return (
    <Link
      href={`/authors/${author.id}`}
      className="block overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:shadow-md"
    >
      <ImageBox src={author.pictureUrl} alt={author.name} fallback="No picture" className="aspect-square" />
      <div className="p-3">
        <h3 className="line-clamp-2 font-semibold text-slate-900">{author.name}</h3>
        {author.tags.length > 0 && (
          <p className="mt-1 line-clamp-1 text-xs text-slate-500">{author.tags.map((t) => t.displayText).join(", ")}</p>
        )}
      </div>
    </Link>
  );
}
