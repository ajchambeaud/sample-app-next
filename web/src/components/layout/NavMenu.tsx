"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/lib/actions/auth";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  /** Marks the item active for any path under this prefix. */
  match: (pathname: string) => boolean;
  protected?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const startsWith = (prefix: string) => (pathname: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

// The menu is organised by what librarians do: browse the catalog, run
// circulation. Circulation holds member data, so it only shows when signed in.
const GROUPS: NavGroup[] = [
  {
    label: "Catalog",
    items: [
      { href: "/", label: "Books", match: (p) => p === "/" || startsWith("/books")(p) },
      { href: "/authors", label: "Authors", match: startsWith("/authors") },
    ],
  },
  {
    label: "Circulation",
    items: [
      { href: "/loans", label: "Loans", match: startsWith("/loans"), protected: true },
      { href: "/members", label: "Members", match: startsWith("/members"), protected: true },
    ],
  },
];

const CREATE_LINKS = [
  { href: "/books/new", label: "Book" },
  { href: "/authors/new", label: "Author" },
  { href: "/members/new", label: "Member" },
];

export function NavMenu({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close the mobile panel after navigating.
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  const groups = GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => !i.protected || user) })).filter((g) => g.items.length);

  return (
    <>
      {/* Desktop */}
      <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
        {groups.map((group, gi) => (
          <div key={group.label} className="flex items-center">
            {gi > 0 && <span className="mx-2 h-5 w-px bg-slate-200" aria-hidden />}
            {group.items.map((item) => (
              <NavLink key={item.href} href={item.href} active={item.match(pathname)}>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="hidden items-center gap-2 md:flex">
        {user ? (
          <>
            <Dropdown label="+ New" primary>
              {CREATE_LINKS.map((l) => (
                <MenuLink key={l.href} href={l.href}>
                  {l.label}
                </MenuLink>
              ))}
            </Dropdown>
            <Dropdown label={user.name} align="right">
              <div className="border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
                Signed in as
                <div className="truncate font-medium text-slate-700">{user.email}</div>
              </div>
              <form action={logout}>
                <button type="submit" className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100">
                  Log out
                </button>
              </form>
            </Dropdown>
          </>
        ) : (
          <>
            <NavLink href="/login" active={pathname === "/login"}>
              Log in
            </NavLink>
            <Link href="/signup" className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700">
              Sign up
            </Link>
          </>
        )}
      </div>

      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        aria-expanded={mobileOpen}
        aria-controls="mobile-menu"
        aria-label="Toggle menu"
        className="rounded p-2 text-slate-600 hover:bg-slate-100 md:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          {mobileOpen ? <path d="M4 4l12 12M16 4L4 16" /> : <path d="M3 5h14M3 10h14M3 15h14" />}
        </svg>
      </button>

      {mobileOpen && (
        <div id="mobile-menu" className="absolute inset-x-0 top-full border-b border-slate-200 bg-white shadow-lg md:hidden">
          <div className="mx-auto max-w-5xl space-y-4 px-4 py-4">
            {groups.map((group) => (
              <MobileGroup key={group.label} label={group.label}>
                {group.items.map((item) => (
                  <MobileLink key={item.href} href={item.href} active={item.match(pathname)}>
                    {item.label}
                  </MobileLink>
                ))}
              </MobileGroup>
            ))}
            {user ? (
              <>
                <MobileGroup label="Create">
                  {CREATE_LINKS.map((l) => (
                    <MobileLink key={l.href} href={l.href} active={pathname === l.href}>
                      New {l.label.toLowerCase()}
                    </MobileLink>
                  ))}
                </MobileGroup>
                <MobileGroup label={`Account · ${user.name}`}>
                  <form action={logout}>
                    <button type="submit" className="block w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100">
                      Log out
                    </button>
                  </form>
                </MobileGroup>
              </>
            ) : (
              <MobileGroup label="Account">
                <MobileLink href="/login" active={pathname === "/login"}>
                  Log in
                </MobileLink>
                <MobileLink href="/signup" active={pathname === "/signup"}>
                  Sign up
                </MobileLink>
              </MobileGroup>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded px-3 py-1.5 text-sm transition",
        active ? "bg-slate-100 font-medium text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      {children}
    </Link>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
      {children}
    </Link>
  );
}

function MobileGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function MobileLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn("rounded px-3 py-2 text-sm", active ? "bg-slate-100 font-medium text-slate-900" : "text-slate-700 hover:bg-slate-50")}
    >
      {children}
    </Link>
  );
}

function Dropdown({
  label,
  children,
  primary,
  align = "left",
}: {
  label: string;
  children: React.ReactNode;
  primary?: boolean;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-1 rounded px-3 py-1.5 text-sm",
          primary ? "bg-slate-900 text-white hover:bg-slate-700" : "text-slate-700 hover:bg-slate-100"
        )}
      >
        {label}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M3 4.5l3 3 3-3" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute top-full z-30 mt-1 min-w-[11rem] overflow-hidden rounded border border-slate-200 bg-white py-1 shadow-lg",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
