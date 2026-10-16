import { writeDurable } from "./durableStorage";
const KEY = "taminot-crm-additional-products-v1";

export function readAdditionalProducts() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];

  const records = JSON.parse(raw);
  if (!Array.isArray(records)) {
    throw new Error("Qo‘shimcha mahsulotlar ma’lumoti noto‘g‘ri.");
  }

  return records;
}

export function saveAdditionalProducts(records) {
  writeDurable("additional", records);
}

export function clearAdditionalProducts() {
  writeDurable("additional", []);
}
