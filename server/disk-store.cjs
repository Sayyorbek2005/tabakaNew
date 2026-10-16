const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

const valid = (name, data) => name === "additional" ? Array.isArray(data) : !!data && data.version === 1 &&
  ["suppliers", "categories", "products", "payments"].every((key) => Array.isArray(data[key])) && !!data.counters;
const digest = (data) => crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");

function createDiskStore(directory, backupDirectory) {
  const primary = path.resolve(directory || path.join(__dirname, "..", "data"));
  const backup = path.resolve(backupDirectory || (directory ? path.join(primary, "external-backup") :
    process.env.TAMINOT_BACKUP_DIR || path.join(os.homedir(), "Documents", "Taminot-zaxiralar", "shirin-crm")));
  if (primary === backup) throw new Error("Zaxira papkasi asosiy papkadan alohida bo‘lishi kerak.");

  function atomic(file, record) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temporary = `${file}.${crypto.randomUUID()}.tmp`;
    const descriptor = fs.openSync(temporary, "wx");
    try { fs.writeFileSync(descriptor, JSON.stringify(record), "utf8"); fs.fsyncSync(descriptor); }
    finally { fs.closeSync(descriptor); }
    fs.renameSync(temporary, file);
  }
  function history(root, name) {
    const folder = path.join(root, "history", name);
    if (!fs.existsSync(folder)) return [];
    return fs.readdirSync(folder).filter((file) => /^[a-zA-Z0-9_-]+\.json$/.test(file)).map((file) => path.join(folder, file));
  }
  function decode(file, name) {
    const record = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!valid(name, record.data) || (record.sha256 && record.sha256 !== digest(record.data))) throw new Error("Nusxa buzilgan.");
    return { ...record, revision: record.revision || 0 };
  }
  function ensureCopies(name, source) {
    const record = { ...source, sha256: digest(source.data), savedAt: source.savedAt || new Date().toISOString() };
    const id = `preserved-${record.revision}-${record.sha256}`;
    for (const root of [primary, backup]) {
      const file = path.join(root, "history", name, `${id}.json`);
      if (!fs.existsSync(file)) atomic(file, record);
    }
    for (const file of [path.join(primary, `${name}.json`), path.join(primary, `${name}.json.bak`), path.join(backup, `${name}-latest.json`)]) {
      let matching = false;
      try {
        const existing = decode(file, name);
        matching = existing.revision === record.revision && existing.sha256 === record.sha256;
      } catch { /* Repair missing/damaged current copies from the verified copy. */ }
      if (!matching) atomic(file, record);
    }
    return record;
  }
  function read(name) {
    const candidates = [path.join(primary, `${name}.json`), path.join(primary, `${name}.json.bak`), path.join(backup, `${name}-latest.json`)];
    const existing = candidates.filter((file) => fs.existsSync(file));
    let best = null;
    for (const file of existing) {
      try { const record = decode(file, name); if (!best || record.revision > best.revision) best = record; } catch { /* Preserve and skip damaged copies. */ }
    }
    if (best) return ensureCopies(name, best);
    const snapshots = [...history(primary, name), ...history(backup, name)];
    for (const file of snapshots) {
      try { const record = decode(file, name); if (!best || record.revision > best.revision) best = record; } catch { /* Try another immutable snapshot. */ }
    }
    if (best) return ensureCopies(name, best);
    if (existing.length || snapshots.length) throw new Error("Saqlangan nusxalarni o‘qib bo‘lmadi. Fayllar o‘chirilmadi.");
    return null;
  }
  function write(name, data, expectedRevision, reason = "save") {
    if (!valid(name, data)) throw Object.assign(new Error("Ma’lumot formati noto‘g‘ri."), { status: 400 });
    const previous = read(name);
    const sha256 = digest(data);
    // A retried request with the same content is safe, even if the response was lost.
    if (previous?.sha256 === sha256) return previous;
    if (previous && expectedRevision !== undefined && expectedRevision !== previous.revision) {
      throw Object.assign(new Error("Boshqa oynada ma’lumot o‘zgargan. Yangi yozuvlar almashtirilmadi."), { status: 409 });
    }
    if (previous?.revision > 0 && expectedRevision === undefined) throw Object.assign(new Error("Eski sahifa nusxasi. Sahifani yangilang."), { status: 409 });
    const record = { data, revision: (previous?.revision || 0) + 1, savedAt: new Date().toISOString(), sha256, reason };
    // First preserve the legacy/current copy in both histories before replacing anything.
    if (previous) {
      const legacyId = `previous-${previous.revision}-${digest(previous.data)}`;
      for (const root of [primary, backup]) {
        const file = path.join(root, "history", name, `${legacyId}.json`);
        if (!fs.existsSync(file)) atomic(file, { ...previous, sha256: digest(previous.data) });
      }
    }
    const id = `${String(record.revision).padStart(12, "0")}-${crypto.randomUUID()}`;
    atomic(path.join(backup, "history", name, `${id}.json`), record);
    atomic(path.join(primary, "history", name, `${id}.json`), record);
    // The backup is a complete current copy, including a deliberate empty/reset state.
    atomic(path.join(backup, `${name}-latest.json`), record);
    atomic(path.join(primary, `${name}.json.bak`), record);
    atomic(path.join(primary, `${name}.json`), record);
    return record;
  }
  function list(name) {
    const unique = new Map();
    for (const file of [...history(primary, name), ...history(backup, name)]) {
      try {
        const record = decode(file, name);
        const id = path.basename(file, ".json");
        const count = name === "additional" ? record.data.length :
          ["suppliers", "categories", "products", "payments", "usages"].reduce((sum, key) => sum + (record.data[key]?.length || 0), 0);
        unique.set(`${record.revision}-${digest(record.data)}`, { id, revision: record.revision, savedAt: record.savedAt, count, reason: record.reason || "previous" });
      } catch { /* Do not offer corrupt snapshots for restore. */ }
    }
    return [...unique.values()].sort((a, b) => b.revision - a.revision);
  }
  function snapshot(name, id) {
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw Object.assign(new Error("Nusxa topilmadi."), { status: 404 });
    for (const root of [primary, backup]) {
      try { return decode(path.join(root, "history", name, `${id}.json`), name); } catch { /* Try the independent copy. */ }
    }
    throw Object.assign(new Error("Nusxa topilmadi yoki buzilgan."), { status: 404 });
  }
  return { read, write, list, snapshot, backupDirectory: backup, directory: primary };
}
module.exports = { createDiskStore, valid };
