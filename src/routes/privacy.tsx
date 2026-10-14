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
        <p className="mt-4 text-muted-foreground">
          PDF and image tools process files locally in your browser. File contents and PDF passwords
          are never sent to our server or saved to browser storage. Temporary buffers and download
          links are released when you clear files, change tools, or close the page. Downloads you
          save remain on your device.
        </p>
        <p className="mt-4 text-muted-foreground">
          Your color-theme preference is saved locally. The toolkit uses system fonts and locally
          served rendering assets.
        </p>
        <p className="mt-4 text-muted-foreground">
          For full details, contact privacy@pdfbuddy.app.
        </p>
      </article>
    </Shell>
  );
}
