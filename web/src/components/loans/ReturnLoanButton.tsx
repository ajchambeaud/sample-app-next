"use client";

import { useState, useTransition } from "react";
import { returnLoan } from "@/lib/actions/loans";
import { buttonClass } from "@/components/ui/styles";

export function ReturnLoanButton({ loanId }: { loanId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await returnLoan(loanId);
            if (result.error) setError(result.error);
          })
        }
        className={buttonClass("secondary", "sm", "px-2 py-1 text-xs")}
      >
        {pending ? "Returning…" : "Mark returned"}
      </button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </span>
  );
}
