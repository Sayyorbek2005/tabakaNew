import { editDateInput, parseDateInput } from "./dateInput";

test("editing the day in a full date preserves the unfinished day and caret", () => {
  expect(editDateInput("1.10.2026", "16.10.2026", 1)).toEqual({ text: "1.10.2026", caret: 1 });
  expect(editDateInput("17.10.2026", "1.10.2026", 2)).toEqual({ text: "17.10.2026", caret: 3 });
});

test("typing and pasting dates advances segments with smart leading zeroes", () => {
  expect(editDateInput("4", "", 1).text).toBe("04.");
  expect(editDateInput("12.4", "12.", 4).text).toBe("12.04.");
  expect(editDateInput("12.1", "12.", 4).text).toBe("12.1");
  expect(editDateInput("16102026", "", 8).text).toBe("16.10.2026");
  expect(editDateInput("16.1.", "16.1", 5).text).toBe("16.01.");
});

test("reject impossible days and months and allow deleting year digits", () => {
  expect(editDateInput("32", "3", 2).text).toBe("3");
  expect(editDateInput("12.13", "12.1", 5).text).toBe("12.1");
  expect(editDateInput("16.10.202", "16.10.2026", 9, true).text).toBe("16.10.202");
  expect(parseDateInput("31.02.2026")).toBe("");
  expect(parseDateInput("29.02.2024")).toBe("2024-02-29");
});
