"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import type { ActionState, Author } from "@/lib/types";
import { uploadImage } from "@/lib/upload-client";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Field } from "@/components/ui/Field";
import { ImageField } from "@/components/ui/ImageField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { TagInput } from "@/components/ui/TagInput";
import { buttonClass, inputClass } from "@/components/ui/styles";

interface AuthorFormProps {
  author?: Author;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}

/** Create/edit form for author profiles; same presign-then-save flow as the book form. */
export function AuthorForm({ author, action }: AuthorFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, { error: null });
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const isEdit = Boolean(author);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError(null);
    const formData = new FormData(e.currentTarget);
    const file = formData.get("picture");
    formData.delete("picture");

    if (file instanceof File && file.size > 0) {
      setProgress(0);
      try {
        formData.set("pictureKey", await uploadImage(file, setProgress));
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
      <h1 className="mb-6 text-2xl font-semibold">{isEdit ? "Edit author" : "Add author"}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name">
          <input type="text" name="name" required defaultValue={author?.name ?? ""} className={inputClass} />
        </Field>
        <div className="block">
          <span className="text-sm text-slate-700">Tags (optional)</span>
          <TagInput initialTags={author?.tags.map((t) => t.displayText) ?? []} />
        </div>
        <Field label="Bio">
          <textarea name="bio" rows={6} defaultValue={author?.bio ?? ""} className={inputClass} />
        </Field>
        <ImageField
          label="Picture (optional)"
          name="picture"
          clearName="clearPicture"
          currentUrl={author?.pictureUrl ?? null}
          previewClassName="h-20 w-20"
          progress={progress}
        />

        <ErrorBanner message={uploadError ?? state.error} />

        <div className="flex gap-3">
          <SubmitButton pendingText="Saving…" busy={progress !== null}>
            {isEdit ? "Save changes" : "Create author"}
          </SubmitButton>
          <button type="button" onClick={() => router.back()} className={buttonClass("secondary")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
