import { copyFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { TOOLS } from "../src/lib/tools.ts";
const root = new URL("../dist/client/", import.meta.url);
const index = new URL("index.html", root);
if (!existsSync(index)) throw new Error("TanStack SPA shell index.html was not generated.");
copyFileSync(index, new URL("404.html", root));
writeFileSync(new URL(".nojekyll", root), "");
// Known routes get an index so direct links return 200; 404.html covers other SPA paths.
for (const route of [
  ...TOOLS.map((tool) => `tools/${tool.slug}`),
  "ai",
  "contact",
  "dashboard",
  "faq",
  "login",
  "pricing",
  "privacy",
  "terms",
]) {
  const folder = new URL(route + "/", root);
  mkdirSync(folder, { recursive: true });
  copyFileSync(index, new URL("index.html", folder));
}
