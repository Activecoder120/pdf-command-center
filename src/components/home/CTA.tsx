import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <div className="relative overflow-hidden rounded-3xl glass-strong p-10 text-center ring-soft md:p-16">
        <div className="absolute inset-0 -z-10 bg-gradient-primary opacity-20" />
        <div className="absolute -inset-x-20 -top-20 -z-10 h-60 bg-gradient-primary opacity-30 blur-3xl" />
        <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold tracking-tight md:text-5xl">
          Ready to make documents <span className="text-gradient">disappear into work</span>?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
          Join thousands of teams using PDFBuddy as their daily document operating system.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link to="/pricing">
            <Button size="lg" className="bg-gradient-primary border-0 text-white hover:opacity-95">
              Start free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/contact">
            <Button size="lg" variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10">
              Talk to sales
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
