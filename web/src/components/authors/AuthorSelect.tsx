"use client";

import { useEffect, useRef, useState } from "react";
import { quickCreateAuthor } from "@/lib/actions/authors";
import { inputClass } from "@/components/ui/styles";

interface AuthorOption {
  id: string;
  name: string;
  pictureUrl: string | null;
}

interface AuthorSelectProps {
  initialName: string;
  initialAuthorId: string | null;
}

/**
 * Author field for the book form. Doubles as the display-name input and an
 * optional link to an Author profile: type to search existing authors, pick
 * one to link, or create a new author inline. Free text with no selection
 * keeps authorId empty (the name string is still saved on the book).
 * Submits `author` (text) and `authorId` (hidden).
 */
export function AuthorSelect({ initialName, initialAuthorId }: AuthorSelectProps) {
  const [name, setName] = useState(initialName);
  const [authorId, setAuthorId] = useState<string | null>(initialAuthorId);
  const [results, setResults] = useState<AuthorOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search while typing without an active link.
  useEffect(() => {
    if (authorId) return;
    const query = name.trim();
    if (!query) return;
    const controller = new AbortController();
    const handle = setTimeout(() => {
      setLoading(true);
      fetch(`/api/authors?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : { authors: [] }))
        .then((data: { authors: AuthorOption[] }) => setResults(data.authors))
        .catch(() => {})
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(handle);
    };
  }, [name, authorId]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      const author = await quickCreateAuthor(trimmed);
      setName(author.name);
      setAuthorId(author.id);
      setOpen(false);
    } catch {
      // Leave as free text if creation fails.
    } finally {
      setCreating(false);
    }
  }

  const trimmed = name.trim();
  const visible = trimmed ? results : [];
  const exactMatch = visible.some((a) => a.name.toLowerCase() === trimmed.toLowerCase());
  const showDropdown = open && !authorId && trimmed.length > 0;

  return (
    <div className="relative" ref={containerRef}>
      <input type="hidden" name="authorId" value={authorId ?? ""} />
      <div className="mt-1 flex items-center gap-2">
        <input
          type="text"
          name="author"
          required
          value={name}
          onChange={(e) => {
            // Editing the text unlinks any previously selected profile.
            setName(e.target.value);
            setAuthorId(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Author name"
          autoComplete="off"
          className={inputClass + " mt-0 flex-1"}
        />
        {authorId && (
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded bg-green-100 px-2 py-1 text-xs text-green-800">
            ✓ linked profile
            <button type="button" onClick={() => setAuthorId(null)} aria-label="Unlink author profile" className="text-green-700 hover:text-green-900">
              ×
            </button>
          </span>
        )}
      </div>

      {showDropdown && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded border border-slate-200 bg-white text-sm shadow-lg">
          {loading && <li className="px-3 py-2 text-slate-400">Searching…</li>}
          {!loading &&
            visible.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => {
                    setName(a.name);
                    setAuthorId(a.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-100"
                >
                  <span className="h-6 w-6 flex-shrink-0 overflow-hidden rounded bg-slate-100">
                    {a.pictureUrl && <img src={a.pictureUrl} alt="" className="h-full w-full object-cover" />}
                  </span>
                  {a.name}
                </button>
              </li>
            ))}
          {!loading && !exactMatch && (
            <li className="border-t border-slate-100">
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                {creating ? "Creating…" : <>Create &ldquo;{trimmed}&rdquo; as a new author</>}
              </button>
            </li>
          )}
          {!loading && visible.length === 0 && exactMatch && <li className="px-3 py-2 text-slate-400">No other matches</li>}
        </ul>
      )}
    </div>
  );
}
