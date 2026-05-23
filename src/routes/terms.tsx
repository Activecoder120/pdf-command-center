import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/layout/Shell";

export const Route = createFileRoute("/terms")({
  component: Terms,
  head: () => ({ meta: [{ title: "Terms — PDFBuddy" }] }),
});

function Terms() {
  return (
    <Shell>
      <article className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-5xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-4 text-muted-foreground">By using PDFBuddy you agree to our fair-use terms. Don't upload illegal content. Don't try to break the service. Be excellent to each other.</p>
      </article>
    </Shell>
  );
}
