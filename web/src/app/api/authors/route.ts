import { NextResponse, type NextRequest } from "next/server";
import { listAuthors } from "@/lib/data/authors";

/** Typeahead source for the book form's author picker. Public, like the authors listing. */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ authors: [] });
  const { items } = await listAuthors({ q, limit: 8 });
  return NextResponse.json({
    authors: items.map((a) => ({ id: a.id, name: a.name, pictureUrl: a.pictureUrl })),
  });
}
