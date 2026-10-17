import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/dal";
import { listMembers } from "@/lib/data/members";

/** Typeahead source for the lend form. Members hold personal data, so auth is required. */
export async function GET(request: NextRequest) {
  if (!(await getSessionUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ members: [] });
  const { items } = await listMembers({ q, limit: 8 });
  return NextResponse.json({
    members: items.map((m) => ({ id: m.id, firstName: m.firstName, lastName: m.lastName, nationalId: m.nationalId })),
  });
}
