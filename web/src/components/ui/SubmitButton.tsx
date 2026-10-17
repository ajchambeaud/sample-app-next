"use client";

import { useFormStatus } from "react-dom";
import { buttonClass, type ButtonVariant } from "./styles";

interface SubmitButtonProps {
  children: React.ReactNode;
  pendingText?: string;
  variant?: ButtonVariant;
  className?: string;
  /** Extra pending state owned by the parent (e.g. an upload in flight). */
  busy?: boolean;
  disabled?: boolean;
}

/** Submit button that disables itself while the surrounding form action runs. */
export function SubmitButton({ children, pendingText, variant = "primary", className, busy, disabled }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isPending = pending || busy;
  return (
    <button type="submit" disabled={isPending || disabled} className={buttonClass(variant, "md", className)}>
      {isPending && pendingText ? pendingText : children}
    </button>
  );
}
