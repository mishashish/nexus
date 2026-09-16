"use client";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import type { ReactNode } from "react";

export function PageShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`mx-auto min-h-screen px-4 py-2 sm:px-6 ${
        wide ? "max-w-[1100px]" : "max-w-[1040px]"
      }`}
    >
      <Header />
      <main className="mt-2">{children}</main>
      <Footer />
    </div>
  );
}
