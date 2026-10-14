import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/layout/Shell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  component: FAQ,
  head: () => ({ meta: [{ title: "FAQ — PDFBuddy" }] }),
});

const Q = [
  {
    q: "Is PDFBuddy free?",
    a: "The browser PDF tools do not require an account or payment. Paid plans and AI are previews, not active services.",
  },
  {
    q: "Are my files private?",
    a: "Files and PDF passwords stay in your browser. Clear files, change tools, or close the page to release temporary data. Saved downloads remain on your device.",
  },
  {
    q: "What file size can I upload?",
    a: "The default limit is 50 MB per file, with 100 MB combined and 30 files per job. Manipulation and rendering support up to 300 pages. The maintainer can configure the per-file limit.",
  },
  { q: "Do you watermark output?", a: "Never. Your documents stay yours." },
  {
    q: "Can I automate workflows?",
    a: "No automation endpoints or webhooks are implemented. The current tools run locally in your browser.",
  },
];

function FAQ() {
  return (
    <Shell>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-5xl font-semibold tracking-tight">Frequently asked</h1>
        <p className="mt-3 text-muted-foreground">Everything you wanted to know about PDFBuddy.</p>
        <Accordion type="single" collapsible className="mt-10 rounded-2xl glass p-2">
          {Q.map((item, i) => (
            <AccordionItem key={i} value={`i${i}`} className="border-border/60 px-4">
              <AccordionTrigger className="text-left font-display text-base">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </Shell>
  );
}
