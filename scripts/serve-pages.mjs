import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

const root = resolve("dist/client");
const prefix = "/pdf-command-center";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".wasm": "application/wasm",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
};
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (pathname !== prefix && !pathname.startsWith(prefix + "/")) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    let path = resolve(root, "." + (pathname.slice(prefix.length) || "/"));
    if (path !== root && !path.startsWith(root + sep)) {
      response.writeHead(403);
      response.end();
      return;
    }
    let status = 200;
    try {
      if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
      await stat(path);
    } catch {
      if (extname(path)) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      status = 404;
      path = resolve(root, "404.html");
    }
    response.writeHead(status, {
      "content-type": types[extname(path)] ?? "application/octet-stream",
    });
    response.end(await readFile(path));
  } catch {
    response.writeHead(400);
    response.end("Bad request");
  }
});
server.listen(5174, "127.0.0.1", () => console.log("Static Pages test server ready on port 5174"));
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close(() => process.exit(0)));
