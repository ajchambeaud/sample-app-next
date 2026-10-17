"use client";

import { useState, type KeyboardEvent } from "react";

interface TagInputProps {
  name?: string;
  initialTags?: string[];
}

/**
 * Chip-style tag editor. Each tag is submitted as a repeated hidden field
 * (`tags`), so the Server Action reads them with formData.getAll().
 */
export function TagInput({ name = "tags", initialTags = [] }: TagInputProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [draft, setDraft] = useState("");

  function addTag(raw: string) {
    const value = raw.trim();
    setDraft("");
    if (!value) return;
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) return;
    setTags([...tags, value]);
  }

  function removeTag(index: number) {
    setTags(tags.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && !draft && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 rounded border border-slate-300 bg-white px-2 py-2 focus-within:ring-2 focus-within:ring-slate-400">
      {tags.map((tag, i) => (
        <span key={`${tag}-${i}`} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-sm text-slate-700">
          <input type="hidden" name={name} value={tag} />
          {tag}
          <button type="button" onClick={() => removeTag(i)} aria-label={`Remove ${tag}`} className="text-slate-500 hover:text-slate-900">
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(draft)}
        placeholder={tags.length === 0 ? "Add tags (Enter or comma)" : ""}
        className="min-w-[8rem] flex-1 px-1 py-0.5 text-sm focus:outline-none"
      />
    </div>
  );
}
