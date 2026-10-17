"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import type { ActionState, Book } from "@/lib/types";
import { uploadImage } from "@/lib/upload-client";
import { AuthorSelect } from "@/components/authors/AuthorSelect";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Field } from "@/components/ui/Field";
import { ImageField } from "@/components/ui/ImageField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { TagInput } from "@/components/ui/TagInput";
import { buttonClass, inputClass } from "@/components/ui/styles";

interface BookFormProps {
  book?: Book;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}

/**
 * Create/edit form. Submission is a three-step flow hidden behind one button:
 * presign (Server Action) -> PUT the cover straight to object storage -> run the
 * save action with the returned key. Covers never go through the Next server.
 */
export function BookForm({ book, action }: BookFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, { error: null });
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const isEdit = Boolean(book);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError(null);
    const formData = new FormData(e.currentTarget);
    const file = formData.get("cover");
    formData.delete("cover");

    if (file instanceof File && file.size > 0) {
      setProgress(0);
      try {
        formData.set("coverKey", await uploadImage(file, setProgress));
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed");
        setProgress(null);
        return;
      }
      setProgress(null);
    }
    startTransition(() => formAction(formData));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">{isEdit ? "Edit book" : "Add book"}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Title">
          <input type="text" name="title" required defaultValue={book?.title ?? ""} className={inputClass} />
        </Field>
        <div className="block">
          <span className="text-sm text-slate-700">Author</span>
          <AuthorSelect initialName={book?.author ?? ""} initialAuthorId={book?.authorId ?? null} />
          <p className="mt-1 text-xs text-slate-400">
            Type to search authors, pick one to link a profile, or create a new one. Plain text works too.
          </p>
        </div>
        <Field label="ISBN (optional)">
          <input type="text" name="isbn" defaultValue={book?.isbn ?? ""} className={inputClass} />
        </Field>
        <div className="block">
          <span className="text-sm text-slate-700">Tags (optional)</span>
          <TagInput initialTags={book?.tags.map((t) => t.displayText) ?? []} />
        </div>
        <Field label="Description">
          <textarea name="description" rows={6} defaultValue={book?.description ?? ""} className={inputClass} />
        </Field>
        <ImageField
          label="Cover (optional)"
          name="cover"
          clearName="clearCover"
          currentUrl={book?.coverUrl ?? null}
          previewClassName="h-24 w-16"
          progress={progress}
        />

        <ErrorBanner message={uploadError ?? state.error} />

        <div className="flex gap-3">
          <SubmitButton pendingText="Saving…" busy={progress !== null}>
            {isEdit ? "Save changes" : "Create book"}
          </SubmitButton>
          <button type="button" onClick={() => router.back()} className={buttonClass("secondary")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
