"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "@/lib/actions/auth";
import { Field } from "@/components/ui/Field";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { inputClass } from "@/components/ui/styles";

export function SignupForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signup, { error: null });

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">Create account</h1>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <Field label="Name">
          <input type="text" name="name" required autoComplete="name" className={inputClass} />
        </Field>
        <Field label="Email">
          <input type="email" name="email" required autoComplete="email" className={inputClass} />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <input type="password" name="password" required minLength={8} autoComplete="new-password" className={inputClass} />
        </Field>
        <ErrorBanner message={state.error} />
        <SubmitButton pendingText="Creating…" className="w-full">
          Sign up
        </SubmitButton>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Already have an account?{" "}
        <Link href={next !== "/" ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="text-slate-900 underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
