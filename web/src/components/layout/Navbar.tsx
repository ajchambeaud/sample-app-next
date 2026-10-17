import Link from "next/link";
import { Suspense } from "react";
import { getSessionUser } from "@/lib/auth/dal";
import { Skeleton } from "@/components/ui/Skeleton";
import { NavMenu } from "./NavMenu";

/**
 * Site header. The brand is static and prerendered; the menu depends on the
 * session cookie, so it streams in behind its own Suspense boundary instead of
 * blocking the whole layout.
 */
export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="relative mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
          Cool Library
        </Link>
        <Suspense fallback={<NavFallback />}>
          <SessionMenu />
        </Suspense>
      </div>
    </header>
  );
}

async function SessionMenu() {
  const user = await getSessionUser();
  return <NavMenu user={user} />;
}

function NavFallback() {
  return (
    <div className="flex items-center gap-3" aria-hidden>
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-20" />
    </div>
  );
}
