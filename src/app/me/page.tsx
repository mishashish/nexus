import type { Metadata } from "next";
import { Cabinet } from "@/components/Cabinet";

export const metadata: Metadata = {
  title: "Cabinet — NEXUS",
  description: "Your seat in the shared mind. Enter this browser, buy a lot, send a scenario.",
};

export default function MePage() {
  return <Cabinet />;
}
