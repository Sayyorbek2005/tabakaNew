// Each separate site origin has its own browser storage. Never change these legacy keys.
export const browserStorageMode = process.env.REACT_APP_STORAGE_MODE !== "server";
const keys = { main: "taminot-crm-v1", additional: "taminot-crm-additional-products-v1" };
const observed = new Map();

function keyFor(name) {
  if (!keys[name]) throw new Error("Bo‘lim topilmadi.");
  return keys[name];
}
function valid(name, data) {
  return name === "additional" ? Array.isArray(data) : data && data.version === 1 && data.counters &&
    ["suppliers", "categories", "products", "payments"].every((key) => Array.isArray(data[key]));
}
function conflict() {
  return Object.assign(new Error("Boshqa oynada yozuvlar o‘zgargan. Zaxira olib, sahifani yangilang."), { status: 409 });
}
export function initializeBrowserStorage() {
  for (const [name, key] of Object.entries(keys)) {
    const pending = localStorage.getItem(`${key}:pending`);
    const raw = pending ?? localStorage.getItem(key);
    if (raw !== null && !valid(name, JSON.parse(raw))) throw new Error("Saqlangan ma’lumot formati noto‘g‘ri. Nusxa o‘chirilmadi.");
    if (pending !== null) {
      const previous = localStorage.getItem(key);
      if (previous !== null && previous !== pending) localStorage.setItem(`${key}:previous`, previous);
      localStorage.setItem(key, pending);
      localStorage.removeItem(`${key}:pending`);
    }
    observed.set(name, raw);
  }
}
export function saveBrowserCollection(name, data) {
  const key = keyFor(name);
  if (!valid(name, data)) throw new Error("Ma’lumot formati noto‘g‘ri.");
  const current = localStorage.getItem(key);
  if (observed.has(name) && observed.get(name) !== current) throw conflict();
  const serialized = JSON.stringify(data);
  if (current !== null && current !== serialized) localStorage.setItem(`${key}:previous`, current);
  localStorage.setItem(key, serialized);
  observed.set(name, serialized);
}
export async function browserStorageRequest(url, options = {}) {
  const match = url.match(/^\/api\/(storage|backups)\/(main|additional)(?:\/(previous)\/restore)?$/);
  if (!match) throw new Error("Zaxira topilmadi.");
  const [, kind, name, id] = match;
  const key = keyFor(name);
  const raw = localStorage.getItem(key);
  const previous = localStorage.getItem(`${key}:previous`);
  if (!options.method || options.method === "GET") {
    if (kind === "backups") return { snapshots: previous === null ? [] : [{ id: "previous", revision: 0, savedAt: new Date().toISOString(), count: name === "additional" ? JSON.parse(previous).length : JSON.parse(previous).products.length }], currentRevision: raw };
    return raw === null ? { exists: false, revision: raw } : { exists: true, data: JSON.parse(raw), revision: raw };
  }
  const input = JSON.parse(options.body);
  if (input.expectedRevision !== raw) throw conflict();
  if (id && previous === null) throw new Error("Zaxira topilmadi.");
  const data = id ? JSON.parse(previous) : input.data;
  saveBrowserCollection(name, data);
  return { saved: true, revision: JSON.stringify(data) };
}
