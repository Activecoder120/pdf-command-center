import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/layout/Shell";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  component: FAQ,
  head: () => ({ meta: [{ title: "FAQ — PDFBuddy" }] }),
});

const Q = [
  { q: "Is PDFBuddy free?", a: "Yes — the core tools are free forever. Upgrade to Pro for unlimited processing and AI." },
  { q: "Are my files private?", a: "Files are encrypted in transit and deleted automatically within one hour of processing." },
  { q: "What file size can I upload?", a: "Free users up to 100MB, Pro up to 1GB per file." },
  { q: "Do you watermark output?", a: "Never. Your documents stay yours." },
  { q: "Can I automate workflows?", a: "Yes — Pro and Team plans include webhook automation via n8n integration." },
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
              <AccordionTrigger className="text-left font-display text-base">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </Shell>
  );
}
