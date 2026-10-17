import type { Metadata } from "next";
import { Suspense } from "react";
import { safeNextPath } from "@/lib/actions/form";
import type { SearchParams } from "@/lib/search-params";
import { getString } from "@/lib/search-params";
import { FormSkeleton } from "@/components/ui/Skeleton";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <SignupContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SignupContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const next = safeNextPath(getString(await searchParams, "next"));
  return <SignupForm next={next} />;
}
