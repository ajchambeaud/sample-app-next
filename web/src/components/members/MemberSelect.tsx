"use client";

import { useEffect, useRef, useState } from "react";
import { inputClass } from "@/components/ui/styles";

export interface MemberOption {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
}

interface MemberSelectProps {
  value: MemberOption | null;
  onChange: (member: MemberOption | null) => void;
}

/** Search-as-you-type picker for a library member (by name, national id or email). Submits `memberId`. */
export function MemberSelect({ value, onChange }: MemberSelectProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const controller = new AbortController();
    const handle = setTimeout(() => {
      setLoading(true);
      fetch(`/api/members?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : { members: [] }))
        .then((data: { members: MemberOption[] }) => setResults(data.members))
        .catch(() => {})
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(handle);
    };
  }, [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (value) {
    return (
      <div className="mt-1 flex items-center justify-between gap-2 rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
        <input type="hidden" name="memberId" value={value.id} />
        <span>
          <span className="font-medium text-slate-900">
            {value.firstName} {value.lastName}
          </span>
          <span className="ml-2 text-slate-500">{value.nationalId}</span>
        </span>
        <button type="button" onClick={() => onChange(null)} className="text-slate-500 hover:text-slate-900">
          Change
        </button>
      </div>
    );
  }

  const trimmed = query.trim();
  const visible = trimmed ? results : [];
  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search member by name, national id or email"
        autoComplete="off"
        className={inputClass}
      />
      {open && trimmed.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded border border-slate-200 bg-white text-sm shadow-lg">
          {loading && <li className="px-3 py-2 text-slate-400">Searching…</li>}
          {!loading && visible.length === 0 && <li className="px-3 py-2 text-slate-400">No members found</li>}
          {!loading &&
            visible.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(m);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-100"
                >
                  <span>
                    {m.lastName}, {m.firstName}
                  </span>
                  <span className="text-slate-500">{m.nationalId}</span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
