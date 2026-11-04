import type { Metadata } from "next";
import Info from "@/components/Info";

export const metadata: Metadata = {
  title: "Info — Ronit Mahajan",
  description:
    "Ronit Mahajan is a creative developer and computer science student building thoughtful full-stack web experiences.",
};

export default function InfoPage() {
  return <Info />;
}
