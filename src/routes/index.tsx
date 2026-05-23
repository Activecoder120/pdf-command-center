import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/layout/Shell";
import { Hero } from "@/components/home/Hero";
import { CommandCenter } from "@/components/home/CommandCenter";
import { Features } from "@/components/home/Features";
import { CTA } from "@/components/home/CTA";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "PDFBuddy — Document Workflows, Reimagined" },
      { name: "description", content: "Cinematic PDF tools, AI document assistant, and workflows built for speed." },
    ],
  }),
});

function Index() {
  return (
    <Shell>
      <Hero />
      <CommandCenter />
      <Features />
      <CTA />
    </Shell>
  );
}
