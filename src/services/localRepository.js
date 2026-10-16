import { writeDurable } from "./durableStorage";
const KEY = "taminot-crm-v1";

export const emptyStore = () => ({
  version: 1,
  suppliers: [],
  categories: [],
  products: [],
  payments: [],
  usages: [],
  counters: {
    supplier: 0,
    category: 0,
    product: 0,
    payment: 0,
    usage: 0,
  },
});

export function loadStore() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return emptyStore();

  const data = JSON.parse(raw);

  if (
    data.version !== 1 ||
    !["suppliers", "categories", "products", "payments"].every(
      (key) => Array.isArray(data[key])
    ) ||
    !data.counters
  ) {
    throw new Error(
      "Saqlangan ma’lumot formati noto‘g‘ri. Ma’lumot avtomatik o‘chirilmaydi."
    );
  }

  if (data.usages !== undefined && !Array.isArray(data.usages)) {
    throw new Error("Sarf tarixi formati noto‘g‘ri.");
  }

  data.usages = data.usages || [];
  data.counters.usage = data.counters.usage || 0;

  return data;
}

export function saveStore(data) {
  writeDurable("main", data);
}
