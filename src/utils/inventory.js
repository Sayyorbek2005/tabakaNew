export const qty = (value) =>
  Math.round((value + Number.EPSILON) * 1000) / 1000;

export const usedOf = (id, usages = []) =>
  qty(
    usages
      .filter((usage) => usage.productId === id)
      .reduce((sum, usage) => sum + usage.quantity, 0)
  );

export const remainingOf = (product, usages = []) =>
  qty(product.quantity - usedOf(product.id, usages));