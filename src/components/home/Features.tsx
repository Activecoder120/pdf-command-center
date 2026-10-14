import { Shield, Cpu, Workflow, Sparkles } from "lucide-react";

const ITEMS = [
  {
    icon: Cpu,
    title: "Local processing",
    desc: "Run PDF tools in your browser with progress, cancellation and downloads.",
  },
  {
    icon: Shield,
    title: "Private by default",
    desc: "Files stay in your browser. Clear files to release temporary data.",
  },
  {
    icon: Workflow,
    title: "Batch PDF tools",
    desc: "Merge ordered files, split page ranges, and edit PDF pages.",
  },
  {
    icon: Sparkles,
    title: "AI preview",
    desc: "AI integrations are planned. The assistant page currently shows sample data.",
  },
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
