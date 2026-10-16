import { round } from "./accounting";
import { parseDateInput } from "./dateInput";

export function additionalPaymentTotals(product) {
  const total = round(Number(product.quantity || 0) * Number(product.cost || 0));
  const payments = product.payments || [];
  const byMethod = (method) => round(payments.filter((item) => item.method === method).reduce((sum, item) => sum + Number(item.amount), 0));
  const cash = byMethod("cash");
  const card = byMethod("card");
  const paid = round(cash + card);
  return { total, cash, card, paid, debt: Math.max(0, round(total - paid)), excess: Math.max(0, round(paid - total)) };
}

export function addAdditionalPayments(product, input) {
  const cash = Number(input.cash ?? 0);
  const card = Number(input.card ?? 0);
  for (const amount of [cash, card]) {
    if (!Number.isFinite(amount) || amount < 0 || round(amount) !== amount || amount > Number.MAX_SAFE_INTEGER / 100) {
      throw new Error("To‘lovni musbat son bilan, 2 tagacha kasr raqamda kiriting.");
    }
  }
  const sums = additionalPaymentTotals(product);
  if (!Number.isFinite(sums.total) || sums.total < 0 || sums.total > Number.MAX_SAFE_INTEGER / 100) throw new Error("Kirim summasi hisoblash chegarasidan tashqarida.");
  if (round(sums.paid + cash + card) > Number.MAX_SAFE_INTEGER / 100) throw new Error("Jami to‘lov hisoblash chegarasidan tashqarida.");
  if (cash + card === 0) return { ...product, payments: product.payments || [] };
  const date = String(input.date || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !parseDateInput(date.split("-").reverse().join("."))) throw new Error("To‘lov sanasini to‘g‘ri kiriting.");
  if (product.date && date < product.date) throw new Error("To‘lov sanasi kirim sanasidan oldin bo‘lmasin.");
  const payments = [...(product.payments || [])];
  for (const [method, amount] of [["cash", cash], ["card", card]]) {
    if (!amount) continue;
    payments.push({
      id: crypto.randomUUID(),
      code: `${product.code}-TOL-${String(payments.length + 1).padStart(3, "0")}`,
      method, amount, date,
      note: String(input.note || "").trim().toLocaleUpperCase("uz-UZ"),
      createdAt: new Date().toISOString(),
    });
  }
  return { ...product, payments };
}
