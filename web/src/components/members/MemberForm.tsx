"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import type { ActionState, Member } from "@/lib/types";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { buttonClass, inputClass } from "@/components/ui/styles";

interface MemberFormProps {
  member?: Member;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}

export function MemberForm({ member, action }: MemberFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, { error: null });
  const isEdit = Boolean(member);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">{isEdit ? "Edit member" : "Add member"}</h1>
      <form action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <input type="text" name="firstName" required defaultValue={member?.firstName ?? ""} className={inputClass} />
          </Field>
          <Field label="Last name">
            <input type="text" name="lastName" required defaultValue={member?.lastName ?? ""} className={inputClass} />
          </Field>
        </div>
        <Field label="National ID">
          <input type="text" name="nationalId" required defaultValue={member?.nationalId ?? ""} className={inputClass} />
        </Field>
        <Field label="Email">
          <input type="email" name="email" required defaultValue={member?.email ?? ""} className={inputClass} />
        </Field>
        <Field label="Phone (optional)">
          <input type="tel" name="phone" defaultValue={member?.phone ?? ""} className={inputClass} />
        </Field>

        <ErrorBanner message={state.error} />

        <div className="flex gap-3">
          <SubmitButton pendingText="Saving…">{isEdit ? "Save changes" : "Create member"}</SubmitButton>
          <button type="button" onClick={() => router.back()} className={buttonClass("secondary")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
