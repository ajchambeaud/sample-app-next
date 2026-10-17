"use client";

import { useEffect } from "react";
import { buttonClass } from "@/components/ui/styles";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-slate-600">An unexpected error occurred while loading this page.</p>
      <button type="button" onClick={reset} className={buttonClass("primary", "md", "mt-6")}>
        Try again
      </button>
    </div>
  );
}
