"use client";

import { useState, useTransition } from "react";
import type { ActionState } from "@/lib/types";
import { buttonClass, type ButtonVariant } from "./styles";

interface ConfirmButtonProps {
  /** Server Action to run once confirmed. It redirects on success or returns an error. */
  action: () => Promise<ActionState>;
  children: React.ReactNode;
  confirmText?: string;
  variant?: ButtonVariant;
}

/**
 * Two-step destructive button: the first click reveals an inline confirmation
 * instead of a native dialog, the second runs the action.
 */
export function ConfirmButton({ action, children, confirmText = "Are you sure?", variant = "danger" }: ConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className={buttonClass(variant, "sm")}>
        {children}
      </button>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-sm">
      <span className="text-slate-700">{confirmText}</span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await action();
            if (result?.error) setError(result.error);
          })
        }
        className={buttonClass("danger", "sm")}
      >
        {pending ? "Deleting…" : "Yes, delete"}
      </button>
      <button type="button" disabled={pending} onClick={() => setConfirming(false)} className={buttonClass("secondary", "sm")}>
        Cancel
      </button>
      {error && <span className="basis-full text-red-700">{error}</span>}
    </span>
  );
}
