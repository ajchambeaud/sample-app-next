import type { Metadata } from "next";
import { Suspense } from "react";
import { safeNextPath } from "@/lib/actions/form";
import type { SearchParams } from "@/lib/search-params";
import { getString } from "@/lib/search-params";
import { FormSkeleton } from "@/components/ui/Skeleton";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const next = safeNextPath(getString(await searchParams, "next"));
  return <LoginForm next={next} />;
}
