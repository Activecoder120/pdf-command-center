import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const NAV = [
  { to: "/tools/merge", label: "Merge" },
  { to: "/tools/split", label: "Split" },
  { to: "/tools/compress", label: "Compress" },
  { to: "/tools/pdf-to-word", label: "Convert" },
  { to: "/ai", label: "AI Assistant" },
  { to: "/pricing", label: "Pricing" },
];

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between gap-4 rounded-2xl px-4 py-2.5 glass-strong ring-soft">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              activeProps={{ className: "rounded-lg px-3 py-1.5 text-sm text-foreground bg-white/5" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Sign in
            </Button>
          </Link>
          <Link to="/pricing">
            <Button size="sm" className="bg-gradient-primary border-0 text-white shadow-[0_8px_30px_-8px_var(--primary)] hover:opacity-90">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Get Pro
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
