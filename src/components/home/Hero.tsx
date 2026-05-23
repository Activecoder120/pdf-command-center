import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, UploadCloud, FileText, Sparkles, Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Hero() {
  return (
    <section className="relative">
      <div className="absolute inset-0 -z-10 bg-hero" />
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            New · AI Document Assistant is live
          </div>
          <h1 className="font-display text-5xl font-semibold tracking-tight md:text-7xl">
            PDF Tools <span className="text-gradient">Reimagined</span><br /> for Speed
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            One‑click document workflows with lightning‑fast processing. Built for teams that move at the speed of thought.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="bg-gradient-primary border-0 text-white shadow-[0_20px_60px_-20px_var(--primary)] hover:opacity-95">
              <UploadCloud className="mr-2 h-4 w-4" /> Upload File
            </Button>
            <Link to="/tools/merge">
              <Button size="lg" variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10">
                Explore Tools <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Cinematic upload demo */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-16 max-w-4xl"
        >
          <div className="absolute -inset-x-12 -inset-y-8 -z-10 rounded-[2.5rem] bg-gradient-primary opacity-20 blur-3xl" />
          <div className="glass-strong ring-soft rounded-3xl p-2">
            <div className="rounded-2xl border border-white/5 bg-[oklch(0.18_0.04_270)] p-6 md:p-10">
              <div className="grid items-center gap-8 md:grid-cols-[1fr_1.1fr]">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Live demo</div>
                  <h3 className="mt-2 font-display text-2xl font-semibold">Drop a PDF — get magic.</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Upload, process, and download in seconds. No watermarks. No wait.
                  </p>
                  <div className="mt-6 space-y-3">
                    {[
                      { icon: UploadCloud, label: "Uploading report.pdf", val: 100 },
                      { icon: Zap, label: "Optimizing structure", val: 82 },
                      { icon: Sparkles, label: "Ready to download", val: 100 },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-primary">
                          <s.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                            <span>{s.label}</span><span>{s.val}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${s.val}%` }}
                              transition={{ duration: 1.4, delay: 0.2 * i, ease: "easeOut" }}
                              className="h-full bg-gradient-primary"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative h-72">
                  {[
                    { x: "10%", y: "10%", delay: 0, rot: -8 },
                    { x: "45%", y: "0%", delay: 0.2, rot: 4 },
                    { x: "30%", y: "40%", delay: 0.4, rot: -2 },
                  ].map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.3 + p.delay }}
                      style={{ left: p.x, top: p.y, rotate: `${p.rot}deg` }}
                      className="absolute h-44 w-32 animate-float rounded-xl glass-strong p-3 ring-soft"
                    >
                      <div className="flex h-full flex-col">
                        <div className="mb-2 inline-flex w-fit items-center gap-1 rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
                          <FileText className="h-2.5 w-2.5" /> PDF
                        </div>
                        <div className="space-y-1.5">
                          {[90, 70, 80, 50, 65].map((w, j) => (
                            <div key={j} className="h-1 rounded-full bg-white/10" style={{ width: `${w}%` }} />
                          ))}
                        </div>
                        <div className="mt-auto h-12 rounded-md bg-gradient-primary opacity-30" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
