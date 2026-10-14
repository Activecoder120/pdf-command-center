import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { submitSupportRequest } from "@/services/supportService";
import { MAX_UPLOAD_BYTES } from "@/lib/upload";
export const Route = createFileRoute("/support")({
  component: Support,
  head: () => ({ meta: [{ title: "Support — PDFBuddy" }] }),
});
const FAQ = [
  [
    "What are the uploading limits?",
    `The configured limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB per file, up to 30 files and 100 MB total. PDF operations support up to 300 pages.`,
  ],
  [
    "Which file types are supported?",
    "PDF tools accept valid PDF files; image tools accept PNG and JPEG. Word conversion is not available.",
  ],
  [
    "Is my file stored?",
    "Files are processed in your browser. They are not uploaded. Clear the workspace or close the tab to release them.",
  ],
  [
    "How do I report a problem?",
    "Open a repository issue with the tool name, browser version, and steps to reproduce. Do not attach confidential documents.",
  ],
  [
    "Can I get a refund?",
    "All current tools are free. Checkout is a demo and takes no money, so there is no charge to refund.",
  ],
  [
    "How can I contact you?",
    "The email below is a placeholder. Use the repository issues link until a support channel is connected.",
  ],
];
function Support() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="font-display text-4xl font-semibold">How can we help?</h1>
        <p className="mt-4 text-muted-foreground">
          Find answers about your files and tools, or prepare a support request.
        </p>
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold">Frequently asked questions</h2>
            <Accordion type="single" collapsible>
              {FAQ.map(([question, answer], index) => (
                <AccordionItem key={question} value={String(index)}>
                  <AccordionTrigger>{question}</AccordionTrigger>
                  <AccordionContent>{answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <p className="mt-6 text-sm">Support email (placeholder): your-email@example.com</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Response time: not yet available; no support inbox is connected.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm underline">
              <Link to="/faq">More documentation</Link>
              <a href="https://github.com/Activecoder120/pdf-command-center/issues">
                Report an issue
              </a>
            </div>
          </div>
          <form
            className="glass rounded-2xl p-6 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              setBusy(true);
              setError("");
              setSuccess(false);
              try {
                await submitSupportRequest({
                  name: String(data.get("name")),
                  email: String(data.get("email")),
                  subject: String(data.get("subject")),
                  message: String(data.get("message")),
                });
                form.reset();
                setSuccess(true);
              } catch (failure) {
                setError(
                  failure instanceof Error
                    ? failure.message
                    : "Could not prepare your request. Try again.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <h2 className="text-xl font-semibold">Contact form</h2>
            <p className="text-sm text-muted-foreground">
              Demo form: submission validates your request only. Nothing is sent or saved.
            </p>
            {(["name", "email", "subject"] as const).map((field) => (
              <label className="block capitalize" key={field}>
                {field[0].toUpperCase() + field.slice(1)}
                <input
                  disabled={!ready || busy}
                  name={field}
                  type={field === "email" ? "email" : "text"}
                  required
                  maxLength={200}
                  autoComplete={field === "subject" ? "off" : field}
                  className="mt-1 block w-full rounded-md border border-border bg-background p-3"
                />
              </label>
            ))}
            <label className="block">
              Message
              <textarea
                disabled={!ready || busy}
                name="message"
                required
                minLength={20}
                maxLength={5000}
                rows={5}
                className="mt-1 block w-full rounded-md border border-border bg-background p-3"
              />
            </label>
            {error && <p role="alert">{error}</p>}
            {success && <p role="status">Demo request validated. No message was sent or stored.</p>}
            <Button disabled={!ready || busy} type="submit">
              {busy ? "Validating…" : "Submit demo request"}
            </Button>
          </form>
        </div>
      </section>
    </Shell>
  );
}
