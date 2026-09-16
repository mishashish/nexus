import type { Metadata } from "next";
import { DocsPage } from "@/components/DocsPage";

export const metadata: Metadata = {
  title: "Docs — NEXUS",
  description:
    "Plain-language documentation for NEXUS: what it is, the terms it uses, how to try it, and what's real vs. simulated.",
};

export default function DocsRoute() {
  return <DocsPage />;
}
