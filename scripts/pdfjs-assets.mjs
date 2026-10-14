import { cpSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
const source = dirname(require.resolve("pdfjs-dist/package.json"));
const destination = new URL("../public/pdfjs/", import.meta.url);
mkdirSync(destination, { recursive: true });
for (const directory of ["cmaps", "standard_fonts", "wasm", "iccs"]) {
  cpSync(join(source, directory), new URL(directory, destination), { recursive: true });
}
