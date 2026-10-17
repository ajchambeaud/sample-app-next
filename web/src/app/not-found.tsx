import Link from "next/link";
import { buttonClass } from "@/components/ui/styles";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="mt-2 text-slate-600">The page you are looking for does not exist or was removed.</p>
      <Link href="/" className={buttonClass("primary", "md", "mt-6")}>
        Back to books
      </Link>
    </div>
  );
}
