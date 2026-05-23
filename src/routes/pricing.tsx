import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  component: Pricing,
  head: () => ({ meta: [{ title: "Pricing — PDFBuddy" }, { name: "description", content: "Simple pricing for teams of every size." }] }),
});

const PLANS = [
  {
    name: "Free", price: "$0", period: "forever",
    desc: "For occasional document work.",
    features: ["Core PDF tools", "2 files / day", "100 MB max", "Standard speed"],
    cta: "Start free", featured: false,
  },
  {
    name: "Pro", price: "$9", period: "/month",
    desc: "For professionals who live in PDFs.",
    features: ["Unlimited processing", "Batch tools", "AI Assistant", "Priority queue", "1 GB files"],
    cta: "Upgrade to Pro", featured: true,
  },
  {
    name: "Team", price: "$29", period: "/month",
    desc: "Shared workflows for teams.",
    features: ["Everything in Pro", "Shared workspace", "Webhook automation", "SSO + audit logs"],
    cta: "Start team trial", featured: false,
  },
];

function Pricing() {
  return (
    <Shell>
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-hero" />
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pricing</div>
          <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight md:text-6xl">
            Simple. <span className="text-gradient">Outrageously fair.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Start free. Upgrade when your workflows demand it. No hidden fees.
          </p>

          <div className="mt-14 grid gap-5 text-left md:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-3xl p-8 ${
                  p.featured ? "glass-strong ring-soft glow-primary" : "glass"
                }`}
              >
                {p.featured && (
                  <div className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-primary px-3 py-1 text-[11px] font-semibold text-white">
                    <Sparkles className="h-3 w-3" /> Most popular
                  </div>
                )}
                <div className="text-sm text-muted-foreground">{p.name}</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <div className="font-display text-5xl font-semibold">{p.price}</div>
                  <div className="text-sm text-muted-foreground">{p.period}</div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                <Button
                  className={`mt-6 w-full ${p.featured ? "bg-gradient-primary border-0 text-white hover:opacity-95" : "bg-white/5 hover:bg-white/10"}`}
                  variant={p.featured ? "default" : "outline"}
                >
                  {p.cta}
                </Button>
                <ul className="mt-7 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  );
}
