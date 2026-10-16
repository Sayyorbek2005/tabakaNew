import { qty } from "./inventory";
import { parseDateInput } from "./dateInput";

export const additionalUsed = (product) => qty((product.usages || []).reduce((sum, usage) => sum + Number(usage.quantity), 0));
export const additionalRemaining = (product) => qty(Number(product.quantity) - additionalUsed(product));

export function addAdditionalUsage(product, input) {
  const quantity = Number(input.quantity);
  const before = additionalRemaining(product);
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity !== qty(quantity) ||
    (product.unit === "dona" && !Number.isInteger(quantity))) {
    throw new Error(product.unit === "dona" ? "Sarf miqdorini butun musbat son bilan kiriting." : "Sarf miqdorini musbat son bilan kiriting (3 tagacha kasr raqam).");
  }
  if (quantity > before) throw new Error("Sarf miqdori mavjud qoldiqdan oshmasin.");
  const date = String(input.date || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !parseDateInput(date.split("-").reverse().join("."))) throw new Error("Sanani to‘g‘ri kiriting.");
  if (product.date && date < product.date) throw new Error("Sarf sanasi kirim sanasidan oldin bo‘lmasin.");
  const usages = product.usages || [];
  const usage = {
    id: crypto.randomUUID(),
    code: `${product.code}-SRF-${String(usages.length + 1).padStart(3, "0")}`,
    quantity,
    unit: product.unit,
    before,
    after: qty(before - quantity),
    date,
    note: String(input.note || "").trim().toLocaleUpperCase("uz-UZ"),
    createdAt: new Date().toISOString(),
  };
  return { ...product, usages: [...usages, usage] };
}
