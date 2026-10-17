"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { inputClass } from "./styles";

interface SearchBarProps {
  placeholder?: string;
  paramName?: string;
}

/**
 * Debounced search box that writes its value to the URL (?q=) so the Server
 * Component list re-renders with fresh data. Changing the query resets paging.
 */
export function SearchBar({ placeholder = "Search...", paramName = "q" }: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(paramName) ?? "";
  const [value, setValue] = useState(current);
  // Last value this component wrote to the URL, so an echo of our own update
  // never overwrites what the user is still typing.
  const [pushed, setPushed] = useState(current);
  const [prevCurrent, setPrevCurrent] = useState(current);
  const [isPending, startTransition] = useTransition();

  // Keep the input in sync when the URL changes from elsewhere (back/forward, chips).
  if (current !== prevCurrent) {
    setPrevCurrent(current);
    if (current !== pushed) setValue(current);
  }

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === current) return;
    const handle = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (trimmed) next.set(paramName, trimmed);
      else next.delete(paramName);
      next.delete("page");
      const qs = next.toString();
      setPushed(trimmed);
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    }, 250);
    return () => clearTimeout(handle);
  }, [value, current, paramName, pathname, router, searchParams]);

  return (
    <div className="relative">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={inputClass + " mt-0"}
      />
      {isPending && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-live="polite">
          Searching…
        </span>
      )}
    </div>
  );
}
