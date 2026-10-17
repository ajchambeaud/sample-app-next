import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth/token";

// Optimistic auth check: only reads the cookie, never the database. The real
// authorization happens in the Data Access Layer and inside every Server Action.
const COOKIE = "cool_library_session";
const SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-me";

const PROTECTED = [/^\/members(\/|$)/, /^\/loans(\/|$)/, /^\/(books|authors)\/new$/, /^\/(books|authors)\/[^/]+\/edit$/];
const AUTH_PAGES = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED.some((re) => re.test(pathname));
  const isAuthPage = AUTH_PAGES.includes(pathname);
  if (!isProtected && !isAuthPage) return NextResponse.next();

  const token = request.cookies.get(COOKIE)?.value;
  const session = token ? await verifySessionToken(token, SECRET) : null;

  if (isProtected && !session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
