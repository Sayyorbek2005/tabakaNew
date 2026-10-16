import {
  allocatePayment,
  debtOf,
  paidOf,
  round,
  totalOf,
  totals,
} from "./accounting";
const products = [
  {
    id: "a",
    code: "MHS-0001",
    supplierId: "s",
    date: "2026-10-01",
    quantity: 10.5,
    price: 1000,
  },
  {
    id: "b",
    code: "MHS-0002",
    supplierId: "s",
    date: "2026-10-02",
    quantity: 2,
    price: 2000,
  },
  {
    id: "c",
    code: "MHS-0003",
    supplierId: "other",
    date: "2026-10-01",
    quantity: 1,
    price: 3000,
  },
];
test("fractional kg and price calculate correctly", () => {
  expect(totalOf(products[0])).toBe(10500);
  expect(round(0.1 + 0.2)).toBe(0.3);
});
test("supplier payment splits oldest first and leaves other suppliers untouched", () => {
  const allocations = allocatePayment(products, [], "s", "", 12000);
  expect(allocations).toEqual([
    { productId: "a", amount: 10500 },
    { productId: "b", amount: 1500 },
  ]);
  const payments = [{ amount: 12000, allocations }];
  expect(paidOf("a", payments)).toBe(10500);
  expect(debtOf(products[1], payments)).toBe(2500);
  expect(debtOf(products[2], payments)).toBe(3000);
  expect(totals(products, payments)).toEqual({
    total: 17500,
    paid: 12000,
    debt: 5500,
  });
});
test("individual payment applies only to selected product", () => {
  expect(allocatePayment(products, [], "s", "b", 1000)).toEqual([
    { productId: "b", amount: 1000 },
  ]);
});
test("overpayment and invalid payments rejected", () => {
  for (const amount of [0, -1, NaN, Infinity, 14500.01, 0.001])
    expect(() => allocatePayment(products, [], "s", "", amount)).toThrow();
  expect(() => allocatePayment(products, [], "s", "c", 1)).toThrow();
});
test("subsequent payments use remaining debt and cancellation restores it", () => {
  const first = { allocations: allocatePayment(products, [], "s", "", 10000) };
  const second = {
    allocations: allocatePayment(products, [first], "s", "", 4500),
  };
  expect(debtOf(products[0], [first, second])).toBe(0);
  expect(debtOf(products[1], [first, second])).toBe(0);
  expect(debtOf(products[0], [first])).toBe(500);
  expect(debtOf(products[1], [first])).toBe(4000);
});
