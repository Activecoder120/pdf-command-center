import { Shield, Cpu, Workflow, Sparkles } from "lucide-react";

const ITEMS = [
  { icon: Cpu, title: "Edge-fast processing", desc: "Every job runs on optimized edge workers. No waiting, no spinners." },
  { icon: Shield, title: "Private by default", desc: "Files are encrypted in transit and auto‑deleted after processing." },
  { icon: Workflow, title: "Built for workflows", desc: "Chain tools together. Batch process. Automate with webhooks." },
  { icon: Sparkles, title: "AI document copilot", desc: "Summarize, extract, translate and answer questions across docs." },
];

export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((it) => (
          <div key={it.title} className="rounded-2xl glass p-6">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-primary">
              <it.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 font-display text-lg font-semibold">{it.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
