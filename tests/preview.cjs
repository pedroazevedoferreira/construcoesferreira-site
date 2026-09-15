const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

const root = path.resolve(__dirname, "..");
const headers = Object.fromEntries(
  fs
    .readFileSync(path.join(root, "_headers"), "utf8")
    .split(/\r?\n/)
    .filter((line) => /^  [A-Za-z]/.test(line))
    .map((line) => {
      const colon = line.indexOf(":");
      return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()];
    }),
);
const redirects = new Map(
  fs
    .readFileSync(path.join(root, "_redirects"), "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const [from, to, status] = line.split(/\s+/);
      return [from, { to, status: Number(status) }];
    }),
);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};

// Serve public site files only. No directory listings, repository data or tools.
const publicPath =
  /^\/(?:[\w-]+\.html|(?:css|js)\/[\w-]+\.(?:css|js)|projetos\/[\w-]+\.html|assets\/(?:[\w-]+\/)*[\w.-]+|robots\.txt|sitemap\.xml)$/;
const server = http.createServer((request, response) => {
  for (const [name, value] of Object.entries(headers))
    response.setHeader(name, value);
  response.setHeader("Cache-Control", "no-store");
  if (
    !/^(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(request.headers.host || "")
  ) {
    response.writeHead(403).end();
    return;
  }
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
  } catch {
    response.writeHead(400).end();
    return;
  }
  const redirect = redirects.get(pathname);
  if (redirect) {
    response.writeHead(redirect.status, { Location: redirect.to }).end();
    return;
  }
  if (pathname === "/") pathname = "/index.html";
  let file = path.resolve(root, `.${pathname}`);
  let status = 200;
  try {
    if (
      !publicPath.test(pathname) ||
      !file.startsWith(root + path.sep) ||
      !mime[path.extname(file)] ||
      !fs.statSync(file).isFile() ||
      !fs.realpathSync(file).startsWith(fs.realpathSync(root) + path.sep)
    ) {
      status = 404;
    }
  } catch {
    status = 404;
  }
  if (status === 404) file = path.join(root, "404.html");
  response.writeHead(status, { "Content-Type": mime[path.extname(file)] });
  response.end(request.method === "HEAD" ? undefined : fs.readFileSync(file));
});
server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
server.listen(0, "127.0.0.1", () => {
  console.log(`Previa local: http://127.0.0.1:${server.address().port}/`);
  console.log("Ctrl+C encerra. Nenhum arquivo foi publicado.");
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close());
}
