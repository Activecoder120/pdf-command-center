import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { TOOLS, accentClass } from "@/lib/tools";
import { ArrowUpRight } from "lucide-react";

export function CommandCenter() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-24">
      <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Document Command Center
          </div>
          <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Every workflow. <span className="text-gradient">One canvas.</span>
          </h2>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          A modular surface of tools designed like an operating system for documents — magnetic, fast, and beautifully consistent.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {TOOLS.map((tool, i) => (
          <motion.div
            key={tool.slug}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              to="/tools/$slug"
              params={{ slug: tool.slug }}
              className="group relative block h-full overflow-hidden rounded-2xl glass p-5 transition-all hover:-translate-y-1 hover:bg-white/[0.07]"
            >
              <div className={`mb-4 inline-grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${accentClass[tool.accent]} text-white shadow-[0_10px_30px_-10px_var(--primary)]`}>
                <tool.icon className="h-5 w-5" />
              </div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-base font-semibold">{tool.name}</h3>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tool.description}</p>
              <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
