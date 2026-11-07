import type { Metadata } from "next";
import WorkReel from "@/components/WorkReel";

export const metadata: Metadata = {
  title: "Work — Ronit Mahajan",
  description:
    "Selected projects by Ronit Mahajan — products, experiments and interfaces built end to end.",
};

export default function WorkPage() {
  return <WorkReel />;
}
