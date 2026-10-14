import { useEffect, useState } from "react";
type Theme = "dark" | "light" | "system";

export function ThemeSelect() {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pdfbuddy-theme");
      setTheme(saved === "dark" || saved === "light" || saved === "system" ? saved : "system");
    } catch {
      setTheme("system");
    }
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.classList.toggle("light", !dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  return (
    <select
      aria-label="Color theme"
      value={theme}
      className="h-9 max-w-24 rounded-md border border-input bg-background px-2 text-xs"
      onChange={(event) => {
        const next = event.target.value as Theme;
        setTheme(next);
        try {
          localStorage.setItem("pdfbuddy-theme", next);
        } catch {
          /* Theme still works when storage is unavailable. */
        }
      }}
    >
      <option value="dark">Dark</option>
      <option value="light">Light</option>
      <option value="system">System</option>
    </select>
  );
}
