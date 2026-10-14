import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { ThemeSelect } from "./ThemeSelect";

const NAV = [
  { slug: "merge", label: "Merge" },
  { slug: "split", label: "Split" },
  { slug: "compress", label: "Compress" },
  { slug: "jpg-to-pdf", label: "Images to PDF" },
  { slug: "organize", label: "Edit pages" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <header className="fixed inset-x-0 top-0 z-40 px-2">
      <div className="mx-auto mt-4 max-w-6xl rounded-2xl border border-border bg-background/95 px-4 py-2.5 shadow-lg backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/"
            aria-label="PDFBuddy home"
            className="shrink-0"
            onClick={() => setOpen(false)}
          >
            <Logo />
          </Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.slug}
                to="/tools/$slug"
                params={{ slug: item.slug }}
                className="rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                activeProps={{ className: "bg-accent text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeSelect />
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              disabled={!ready}
              aria-controls="mobile-navigation"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        {open && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="mt-3 grid gap-1 border-t border-border pt-3 lg:hidden"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setOpen(false);
                document
                  .querySelector<HTMLButtonElement>('[aria-controls="mobile-navigation"]')
                  ?.focus();
              }
            }}
          >
            {NAV.map((item) => (
              <Link
                key={item.slug}
                to="/tools/$slug"
                params={{ slug: item.slug }}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm hover:bg-accent"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
