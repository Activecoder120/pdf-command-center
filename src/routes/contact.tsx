import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({ meta: [{ title: "Contact — PDFBuddy" }] }),
});

function Contact() {
  return (
    <Shell>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-5xl font-semibold tracking-tight">Get in touch</h1>
        <p className="mt-3 text-muted-foreground">Tell us about your workflow. We usually reply within a few hours.</p>
        <form className="mt-10 grid gap-4 rounded-3xl glass p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Name</Label><Input className="mt-1.5 bg-white/[0.03]" placeholder="Jane Doe" /></div>
            <div><Label>Email</Label><Input className="mt-1.5 bg-white/[0.03]" placeholder="jane@company.com" /></div>
          </div>
          <div><Label>Message</Label><Textarea rows={6} className="mt-1.5 bg-white/[0.03]" placeholder="What are you trying to build?" /></div>
          <Button className="w-fit bg-gradient-primary border-0 text-white">Send message</Button>
        </form>
      </section>
    </Shell>
  );
}
