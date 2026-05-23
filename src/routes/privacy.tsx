import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/layout/Shell";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
  head: () => ({ meta: [{ title: "Privacy — PDFBuddy" }] }),
});

function Privacy() {
  return (
    <Shell>
      <article className="mx-auto max-w-3xl px-6 py-16 prose prose-invert">
        <h1 className="font-display text-5xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-muted-foreground">We respect your privacy. Files are encrypted in transit, processed in isolated workers, and auto-deleted within one hour. We never sell your data.</p>
        <p className="mt-4 text-muted-foreground">For full details, contact privacy@pdfbuddy.app.</p>
      </article>
    </Shell>
  );
}
