import { defineConfig, type UserConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig(async ({ command, mode }): Promise<UserConfig> => {
  const pages = mode === "pages";
  const base = pages ? "/pdf-command-center/" : "/";
  if (command === "build" && !pages) process.env.WRANGLER_LOG_PATH ??= resolve(".wrangler/logs");
  const cloudflare =
    command === "build" && !pages
      ? (await import("@cloudflare/vite-plugin")).cloudflare
      : undefined;
  return {
    base,
    plugins: [
      ...(cloudflare ? [cloudflare({ viteEnvironment: { name: "ssr" } })] : []),
      tanstackStart({
        client: { entry: "client" },
        server: { entry: "server" },
        spa: pages ? { enabled: true, prerender: { outputPath: "/index" } } : undefined,
      }),
      react(),
      tailwindcss(),
    ],
    server: { host: "127.0.0.1", port: 5173 },
    resolve: { tsconfigPaths: true },
    worker: { format: "es" },
  };
});
