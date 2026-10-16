import { matchesDateRange, matchesSearch } from "./filters";

test("search ignores Uzbek apostrophe variants, case, spacing and word order", () => {
  expect(matchesSearch("  iphone  o'zbek ", ["O‘ZBEK", "IPHONE"])).toBe(true);
  expect(matchesSearch("oʻzbek", ["O’ZBEK"])).toBe(true);
  expect(matchesSearch("unknown", ["O‘ZBEK"])).toBe(false);
});

test("phone search accepts unformatted digits", () => {
  expect(matchesSearch("998901234567", ["+998 (90) 123-45-67"])).toBe(true);
});

test("date bounds include both days and accept stored date formats", () => {
  for (const date of ["2026-10-16", "16.10.2026", "2026-10-16T08:00:00Z"]) {
    expect(matchesDateRange(date, "2026-10-16", "2026-10-16")).toBe(true);
  }
  expect(matchesDateRange("2026-10-15", "2026-10-16", "2026-10-16")).toBe(false);
  expect(matchesDateRange("2026-10-17", "2026-10-16", "2026-10-16")).toBe(false);
  expect(matchesDateRange("", "2026-10-16", "")).toBe(false);
  expect(matchesDateRange("", "", "")).toBe(true);
});

test("a single first date selects exactly that day; two dates select the inclusive range", () => {
  expect(matchesDateRange("2026-10-16", "2026-04-17", "")).toBe(false);
  expect(matchesDateRange("2026-04-17", "2026-04-17", "")).toBe(true);
  expect(matchesDateRange("2026-10-16", "2026-04-17", "2026-10-16")).toBe(true);
  expect(matchesDateRange("2026-10-17", "2026-04-17", "2026-10-16")).toBe(false);
  expect(matchesDateRange("2026-10-16", "", "2026-10-16")).toBe(true);
});
