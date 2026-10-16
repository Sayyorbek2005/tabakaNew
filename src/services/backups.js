import { browserStorageMode, browserStorageRequest } from "./browserStorage";
import { loadStore } from "./localRepository";
import { readAdditionalProducts } from "./additionalProductRepository";

export function downloadFullBackup() {
  const bundle = { format: "taminot-full-backup", version: 1, exportedAt: new Date().toISOString(), main: loadStore(), additional: readAdditionalProducts() };
  const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `taminot-zaxira-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function backupRequest(url, options = {}) {
  if (browserStorageMode) return browserStorageRequest(url, options);
  const response = await fetch(url, { ...options, cache: "no-store" });
  if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("Zaxira serveriga ulanib bo‘lmadi.");
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Amal bajarilmadi.");
  return result;
}

export function readBackupFile(text) {
  const bundle = JSON.parse(text);
  const validMain = (data) => !!data && data.version === 1 && !!data.counters &&
    ["suppliers", "categories", "products", "payments"].every((key) => Array.isArray(data[key]));
  if (bundle?.format === "taminot-full-backup" && bundle.version === 1 && validMain(bundle.main) && Array.isArray(bundle.additional)) return bundle;
  if (validMain(bundle)) return { main: bundle };
  if (Array.isArray(bundle)) return { additional: bundle };
  throw new Error("Zaxira fayli formati tanilmadi.");
}

export async function preservePendingAndReload() {
  downloadFullBackup();
  const records = await Promise.all(["main", "additional"].map(async (name) => [name, await backupRequest(`/api/storage/${name}`)]));
  if (records.some(([, record]) => !record.exists)) throw new Error("Server nusxasi to‘liq topilmadi. Brauzerdagi nusxa o‘zgartirilmadi.");
  for (const [name, record] of records) {
    const key = name === "main" ? "taminot-crm-v1" : "taminot-crm-additional-products-v1";
    const pending = localStorage.getItem(`${key}:pending`);
    if (pending) localStorage.setItem(`${key}:unsent:${Date.now()}`, pending);
    applyRestoredCollection(name, record.data, record.revision);
  }
  window.location.reload();
}

export function applyRestoredCollection(name, data, revision) {
  const key = name === "main" ? "taminot-crm-v1" : "taminot-crm-additional-products-v1";
  localStorage.setItem(key, JSON.stringify(data));
  localStorage.removeItem(`${key}:pending`);
  if (!browserStorageMode) localStorage.setItem(`${key}:revision`, String(revision));
}
