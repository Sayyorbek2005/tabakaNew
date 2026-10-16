const http = require("http");
const fs = require("fs");
const path = require("path");
const { createStorageApi } = require("./storage-api.cjs");
const storage = createStorageApi();
const root = path.resolve(__dirname, "..", "build");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".ttf": "font/ttf", ".svg": "image/svg+xml", ".png": "image/png" };
const server = http.createServer((req, res) => storage(req, res, () => {
  if (!["GET", "HEAD"].includes(req.method)) { res.writeHead(405); res.end(); return; }
  let requested;
  try { requested = decodeURIComponent(new URL(req.url, "http://localhost").pathname); }
  catch { res.writeHead(400); res.end(); return; }
  let file = path.resolve(root, `.${requested}`);
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); res.end(); return; }
  if (file === root || !fs.existsSync(file) || !fs.statSync(file).isFile()) file = path.join(root, "index.html");
  if (!fs.existsSync(file)) { res.writeHead(503); res.end("Avval npm run build buyrug‘ini bajaring."); return; }
  res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
  if (path.extname(file) === ".html") res.setHeader("Cache-Control", "no-cache");
  if (req.method === "HEAD") { res.end(); return; }
  fs.createReadStream(file).on("error", () => res.destroy()).pipe(res);
}));
server.listen(Number(process.env.PORT || 3001), "127.0.0.1", () => console.log("Sayt va doimiy saqlash: http://localhost:3001"));
