import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/layout/Shell";
import { Sparkles, Send, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/ai")({
  component: AI,
  head: () => ({ meta: [{ title: "AI Assistant — PDFBuddy" }, { name: "description", content: "Chat with your documents. Summarize, extract, translate." }] }),
});

const MSGS = [
  { from: "ai", text: "Hi — drop a PDF and ask me anything. I can summarize, extract tables, translate, or answer questions across multiple docs." },
  { from: "me", text: "Summarize Q3-report.pdf in 3 bullet points." },
  { from: "ai", text: "• Revenue grew 38% YoY to $24.1M\n• Net retention reached 128%\n• Two new enterprise contracts signed in EMEA" },
];

function AI() {
  return (
    <Shell>
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">AI Assistant</div>
        <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight md:text-6xl">
          Chat with your <span className="text-gradient">documents</span>.
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">Summarize, extract, translate, and answer questions across hundreds of PDFs.</p>

        <div className="mt-10 grid gap-4 md:grid-cols-[1fr_2fr]">
          <div className="rounded-2xl glass p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Library</div>
            <ul className="mt-4 space-y-2">
              {["Q3-report.pdf", "contract-v3.pdf", "research.pdf"].map((f) => (
                <li key={f} className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
                  <FileText className="h-4 w-4 text-primary" /> {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl glass-strong ring-soft p-5">
            <div className="space-y-3">
              {MSGS.map((m, i) => (
                <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm ${
                    m.from === "me" ? "bg-gradient-primary text-white" : "bg-white/5 text-foreground"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 rounded-xl bg-white/[0.03] p-2 ring-1 ring-white/10">
              <Sparkles className="ml-2 h-4 w-4 text-primary" />
              <input className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground" placeholder="Ask anything across your library..." />
              <Button size="sm" className="bg-gradient-primary border-0 text-white"><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
