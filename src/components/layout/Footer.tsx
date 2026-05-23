import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

const COLS = [
  {
    title: "Tools",
    links: [
      { to: "/tools/merge", label: "Merge PDF" },
      { to: "/tools/split", label: "Split PDF" },
      { to: "/tools/compress", label: "Compress" },
      { to: "/tools/pdf-to-word", label: "PDF to Word" },
      { to: "/tools/jpg-to-pdf", label: "JPG to PDF" },
    ],
  },
  {
    title: "Product",
    links: [
      { to: "/pricing", label: "Pricing" },
      { to: "/ai", label: "AI Assistant" },
      { to: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/contact", label: "Contact" },
      { to: "/faq", label: "FAQ" },
      { to: "/privacy", label: "Privacy" },
      { to: "/terms", label: "Terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border/60 bg-background/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Document workflows, reimagined. Lightning-fast PDF tools and AI for modern teams.
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{c.title}</div>
            <ul className="mt-4 space-y-2.5">
              {c.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-foreground/80 hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} PDFBuddy — Document workflows, reimagined.
      </div>
    </footer>
  );
}
