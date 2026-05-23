import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/layout/Shell";
import { FileText, Clock, Sparkles, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — PDFBuddy" }] }),
});

function Dashboard() {
  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Workspace</div>
            <h1 className="mt-2 font-display text-4xl font-semibold">Good evening, Alex.</h1>
          </div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-4">
          {[
            { icon: FileText, label: "Files processed", val: "1,284" },
            { icon: Clock, label: "Time saved", val: "47h" },
            { icon: Sparkles, label: "AI queries", val: "312" },
            { icon: TrendingUp, label: "Plan usage", val: "62%" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl glass p-5">
              <s.icon className="h-4 w-4 text-primary" />
              <div className="mt-3 font-display text-3xl font-semibold">{s.val}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl glass-strong ring-soft">
          <div className="border-b border-border/60 p-5 font-display text-lg font-semibold">Recent activity</div>
          <ul className="divide-y divide-border/60">
            {["Merged 3 PDFs · invoice-set.pdf", "Compressed report.pdf (-78%)", "AI summary · whitepaper.pdf", "PDF → Word · contract.docx"].map((t, i) => (
              <li key={i} className="flex items-center justify-between p-5 text-sm">
                <span className="text-foreground/90">{t}</span>
                <span className="text-xs text-muted-foreground">{i + 1}h ago</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Shell>
  );
}
