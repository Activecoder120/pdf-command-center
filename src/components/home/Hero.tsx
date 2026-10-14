import { useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, UploadCloud, Sparkles, Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Hero() {
  const reducedMotion = useReducedMotion();
  return (
    <section className="relative">
      <div className="absolute inset-0 -z-10 bg-hero" />
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Browser PDF tools · no account required
          </div>
          <h1 className="font-display text-5xl font-semibold tracking-tight md:text-7xl">
            PDF Tools <span className="text-gradient">Reimagined</span>
            <br /> for Speed
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            One‑click document workflows with lightning‑fast processing. Built for teams that move
            at the speed of thought.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-gradient-primary border-0 text-white shadow-[0_20px_60px_-20px_var(--primary)] hover:opacity-95"
            >
              <Link to="/tools/$slug" params={{ slug: "merge" }}>
                <UploadCloud className="mr-2 h-4 w-4" /> Upload File
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a
                href="#tools"
                onClick={(event) => {
                  event.preventDefault();
                  document
                    .getElementById("tools")
                    ?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth" });
                  window.history.replaceState(null, "", "#tools");
                }}
              >
                Explore Tools <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Cinematic upload demo */}
        <div className="relative mx-auto mt-16 max-w-4xl">
          <div className="absolute -inset-x-12 -inset-y-8 -z-10 rounded-[2.5rem] bg-gradient-primary opacity-20 blur-3xl" />
          <div className="hero-preview-panel ring-soft rounded-3xl p-2">
            <div className="rounded-2xl border border-white/5 bg-[oklch(0.18_0.04_270)] p-6 md:p-10">
              <div className="grid items-center gap-8 md:grid-cols-[1fr_1.1fr]">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Example workflow
                  </div>
                  <h3 className="mt-2 font-display text-2xl font-semibold">
                    Drop a PDF — get magic.
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Upload, process, and download in seconds. No watermarks. No wait.
                  </p>
                  <div className="mt-6 space-y-3">
                    {[
                      { icon: UploadCloud, label: "Uploading report.pdf", val: 100 },
                      { icon: Zap, label: "Optimizing structure", val: 82 },
                      { icon: Sparkles, label: "Ready to download", val: 100 },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-primary">
                          <s.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                            <span>{s.label}</span>
                            <span>{s.val}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                            <div
                              style={{ width: `${s.val}%` }}
                              className="h-full origin-left bg-gradient-primary"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div data-testid="hero-pdf-cards" className="relative h-72">
                  <img
                    src={`${import.meta.env.BASE_URL}hero-pdf-cards.svg`}
                    alt="Three overlapping PDF document previews"
                    width="460"
                    height="288"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
