import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { FaustineAgentMount } from "@/components/faustine/FaustineAgentMount";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Cool Library", template: "%s · Cool Library" },
  description: "Catalog, authors, members and loans for a small library.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
        <FaustineAgentMount />
      </body>
    </html>
  );
}
