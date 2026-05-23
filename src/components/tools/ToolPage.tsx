import { Shell } from "@/components/layout/Shell";
import { UploadZone } from "@/components/tools/UploadZone";
import { TOOLS, accentClass } from "@/lib/tools";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Zap, Shield, Sparkles } from "lucide-react";

export function ToolPage({ slug }: { slug: string }) {
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) {
    return (
      <Shell>
        <div className="mx-auto max-w-2xl px-6 py-32 text-center">
          <h1 className="font-display text-3xl">Tool not found</h1>
          <Link to="/" className="mt-4 inline-block text-primary">Back home</Link>
        </div>
      </Shell>
    );
  }
  const Icon = tool.icon;
  return (
    <Shell>
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-hero" />
        <div className="mx-auto max-w-5xl px-6 py-16">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All tools
          </Link>
          <div className="mt-8 flex items-start gap-5">
            <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${accentClass[tool.accent]} text-white shadow-[0_20px_60px_-20px_var(--primary)]`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">{tool.name}</h1>
              <p className="mt-2 max-w-xl text-muted-foreground">{tool.description}</p>
            </div>
          </div>

          <div className="mt-10">
            <UploadZone />
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {[
              { icon: Zap, label: "Processed in seconds" },
              { icon: Shield, label: "Auto-deleted after 1 hour" },
              { icon: Sparkles, label: "No watermarks, ever" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl glass p-4">
                <b.icon className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground/90">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  );
}
