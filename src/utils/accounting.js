export const money = (value) =>
  `${new Intl.NumberFormat("uz-UZ", {
    maximumFractionDigits: 2,
  }).format(value || 0)} so‘m`;

export const number = (value) =>
  new Intl.NumberFormat("uz-UZ", {
    maximumFractionDigits: 3,
  }).format(value || 0);

export const today = () => {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const round = (value) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const totalOf = (product) =>
  round(product.quantity * product.price);

export const paidOf = (id, payments) =>
  round(
    payments.reduce(
      (sum, payment) =>
        sum +
        payment.allocations
          .filter((allocation) => allocation.productId === id)
          .reduce(
            (subtotal, allocation) => subtotal + allocation.amount,
            0
          ),
      0
    )
  );

export const debtOf = (product, payments) =>
  round(totalOf(product) - paidOf(product.id, payments));

export function totals(products, payments) {
  const total = round(
    products.reduce((sum, product) => sum + totalOf(product), 0)
  );

  const paid = round(
    products.reduce(
      (sum, product) => sum + paidOf(product.id, payments),
      0
    )
  );

  return { total, paid, debt: round(total - paid) };
}

export function positive(value, name, decimals = 2) {
  const result = Number(value);

  if (
    !Number.isFinite(result) ||
    result <= 0 ||
    result > 1000000000000 ||
    Math.abs(
      result * 10 ** decimals -
        Math.round(result * 10 ** decimals)
    ) > 0.0001
  ) {
    throw new Error(
      `${name}: musbat son kiriting. Ko‘pi bilan ${decimals} kasr xona.`
    );
  }

  return result;
}

export function allocatePayment(
  products,
  payments,
  supplierId,
  productId,
  amount
) {
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    round(amount) !== amount
  ) {
    throw new Error(
      "To‘lov musbat bo‘lsin va ko‘pi bilan 2 kasr xona kiriting."
    );
  }

  const eligible = products
    .filter(
      (product) =>
        product.supplierId === supplierId &&
        (!productId || product.id === productId)
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.code.localeCompare(b.code)
    );

  const available = round(
    eligible.reduce(
      (sum, product) => sum + debtOf(product, payments),
      0
    )
  );

  if (amount > available) {
    throw new Error(
      `To‘lov qarzdan oshmasin. Mavjud qarz: ${money(available)}`
    );
  }

  let remaining = amount;
  const allocations = [];

  for (const product of eligible) {
    const part = round(
      Math.min(remaining, debtOf(product, payments))
    );

    if (part > 0) {
      allocations.push({
        productId: product.id,
        amount: part,
      });

      remaining = round(remaining - part);
    }

    if (remaining === 0) break;
  }

  if (remaining !== 0 || !allocations.length) {
    throw new Error("To‘lov uchun mos qarz topilmadi.");
  }

  return allocations;
}