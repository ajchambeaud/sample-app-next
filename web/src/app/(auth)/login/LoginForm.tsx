"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import { Field } from "@/components/ui/Field";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { inputClass } from "@/components/ui/styles";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(login, { error: null });

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">Log in</h1>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <Field label="Email">
          <input type="email" name="email" required autoComplete="email" className={inputClass} />
        </Field>
        <Field label="Password">
          <input type="password" name="password" required autoComplete="current-password" className={inputClass} />
        </Field>
        <ErrorBanner message={state.error} />
        <SubmitButton pendingText="Signing in…" className="w-full">
          Log in
        </SubmitButton>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        No account?{" "}
        <Link href={next !== "/" ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="text-slate-900 underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
