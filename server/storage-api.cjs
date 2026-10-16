const { createDiskStore } = require("./disk-store.cjs");

function createStorageApi(directory, options = {}) {
  const store = createDiskStore(directory, options.backupDirectory);
  return async function storageApi(req, res, next = () => { res.statusCode = 404; res.end(); }) {
    const pathname = new URL(req.originalUrl || req.url, "http://localhost").pathname;
    const dataMatch = pathname.match(/^\/api\/storage\/(main|additional)$/);
    const backupMatch = pathname.match(/^\/api\/backups\/(main|additional)(?:\/([a-zA-Z0-9_-]+)\/(restore))?$/);
    if (!dataMatch && !backupMatch) return next();
    const name = (dataMatch || backupMatch)[1];
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    const send = (status, data) => { res.statusCode = status; res.end(JSON.stringify(data)); };
    try {
      if (req.method === "GET") {
        const record = store.read(name);
        if (backupMatch) return send(200, { snapshots: store.list(name), currentRevision: record?.revision || 0 });
        return send(200, record ? { exists: true, ...record } : { exists: false, revision: 0 });
      }
      if (!((dataMatch && req.method === "PUT") || (backupMatch?.[2] && req.method === "POST"))) return send(405, { error: "Usul ruxsat etilmagan." });
      if (!String(req.headers["content-type"] || "").startsWith("application/json")) return send(415, { error: "JSON kerak." });
      const origin = req.headers.origin;
      if (origin && new URL(origin).host !== req.headers.host) return send(403, { error: "Begona manbadan yozish taqiqlangan." });
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 8 * 1024 * 1024) return send(413, { error: "Ma’lumot hajmi juda katta." });
      }
      const input = JSON.parse(body);
      const data = backupMatch ? store.snapshot(name, backupMatch[2]).data : input.data;
      const record = store.write(name, data, input.expectedRevision, backupMatch ? "restore" : "save");
      return send(200, { saved: true, savedAt: record.savedAt, revision: record.revision });
    } catch (error) {
      return send(error.status || 500, { error: error instanceof SyntaxError ? "JSON formati noto‘g‘ri." : error.status ? error.message : "Ma’lumotni saqlash yoki o‘qish amalga oshmadi. Nusxalar o‘chirilmadi." });
    }
  };
}
module.exports = { createStorageApi };
