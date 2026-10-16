import { browserStorageMode, initializeBrowserStorage, saveBrowserCollection } from "./browserStorage";
const collections = {
  main: "taminot-crm-v1",
  additional: "taminot-crm-additional-products-v1",
};
const jobs = new Map();
const revisions = new Map();
const conflicts = new Set();
const listeners = new Set();
let running = false;
let retryTimer;
let state = { status: "loading", message: "Ma’lumotlar yuklanmoqda…" };
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", (event) => {
    if (jobs.size) { event.preventDefault(); event.returnValue = ""; }
  });
  window.addEventListener("online", () => { if (jobs.size) void flush(); });
}

function publish(status, message) {
  state = { status, message };
  listeners.forEach((listener) => listener(state));
}
export const getStorageStatus = () => state;
export function subscribeStorageStatus(listener) { listeners.add(listener); return () => listeners.delete(listener); }

async function request(name, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`/api/storage/${name}`, { ...options, cache: "no-store", signal: controller.signal });
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
      throw Object.assign(new Error("Doimiy saqlash serveriga ulanib bo‘lmadi."), { status: response.status });
    }
    return await response.json();
  } finally { clearTimeout(timeout); }
}

async function flush() {
  if (running) return;
  running = true;
  clearTimeout(retryTimer);
  try {
    publish("saving", "Ma’lumotlar saqlanmoqda…");
    while (jobs.size) {
      const [name, serialized] = jobs.entries().next().value;
      if (conflicts.has(name)) throw Object.assign(new Error("Nusxalar mos emas."), { status: 409 });
      const result = await request(name, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: JSON.parse(serialized), expectedRevision: revisions.get(name) }), keepalive: serialized.length < 30000,
      });
      revisions.set(name, result.revision || 0);
      localStorage.setItem(`${collections[name]}:revision`, String(result.revision || 0));
      if (jobs.get(name) === serialized) {
        jobs.delete(name);
        localStorage.removeItem(`${collections[name]}:pending`);
      }
    }
    publish("saved", "Kompyuterda saqlandi");
  } catch (error) {
    if (error.status === 409) publish("conflict", "Boshqa oynada yangi yozuvlar bor. Ular almashtirilmadi. Zaxira nusxani yuklab olib, sahifani yangilang.");
    else {
      publish("offline", "Doimiy nusxa hali saqlanmadi. Brauzerdagi nusxa saqlangan; serverga qayta urinilmoqda.");
      retryTimer = setTimeout(flush, 15000);
    }
  } finally { running = false; }
}

export function writeDurable(name, data) {
  if (browserStorageMode) {
    saveBrowserCollection(name, data);
    publish("saved", "Brauzerda saqlandi");
    return;
  }
  const serialized = JSON.stringify(data);
  const key = collections[name];
  // Mark unsent changes before updating the cache, so closing immediately is recoverable.
  localStorage.setItem(`${key}:pending`, serialized);
  localStorage.setItem(key, serialized);
  jobs.set(name, serialized);
  void flush();
}

export async function initializeStorage() {
  if (browserStorageMode) {
    initializeBrowserStorage();
    publish("saved", "Brauzerda saqlandi");
    return true;
  }
  let unavailable = false;
  let canOpen = true;
  await Promise.all(Object.entries(collections).map(async ([name, key]) => {
    try {
      const remote = await request(name);
      revisions.set(name, remote.revision || 0);
      const pending = localStorage.getItem(`${key}:pending`);
      const local = localStorage.getItem(key);
      if (pending !== null) {
        JSON.parse(pending);
        localStorage.setItem(key, pending);
        jobs.set(name, pending);
        const baseRevision = Number(localStorage.getItem(`${key}:revision`) || 0);
        if (remote.exists && baseRevision !== (remote.revision || 0) && JSON.stringify(remote.data) !== pending) conflicts.add(name);
      } else if (remote.exists) {
        if (local !== null && local !== JSON.stringify(remote.data)) {
          // Preserve older browser-only data before loading the durable server copy.
          localStorage.setItem(`${key}:previous:${Date.now()}`, local);
        }
        localStorage.setItem(key, JSON.stringify(remote.data));
      } else if (local !== null) {
        JSON.parse(local);
        localStorage.setItem(`${key}:pending`, local);
        jobs.set(name, local);
      }
      if (!pending) localStorage.setItem(`${key}:revision`, String(remote.revision || 0));
    } catch {
      unavailable = true;
      revisions.set(name, Number(localStorage.getItem(`${key}:revision`) || 0));
      // A failed server read must never clear the existing browser copy.
      const pending = localStorage.getItem(`${key}:pending`);
      if (pending !== null) {
        localStorage.setItem(key, pending);
        jobs.set(name, pending);
      }
      if (pending === null && localStorage.getItem(key) === null) canOpen = false;
    }
  }));
  if (jobs.size) await flush();
  else if (unavailable) publish("offline", "Doimiy saqlash serveri ulanmagan. Hozir brauzerdagi nusxa ochildi.");
  else publish("saved", "Kompyuterda saqlandi");
  return canOpen;
}

export function retryDurableStorage() {
  if (jobs.size) void flush();
  else void initializeStorage();
}
