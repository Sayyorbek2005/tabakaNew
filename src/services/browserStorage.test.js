import { initializeBrowserStorage, saveBrowserCollection, browserStorageRequest } from "./browserStorage";

const key = "taminot-crm-additional-products-v1";
beforeEach(() => { localStorage.clear(); initializeBrowserStorage(); });
test("fresh browser opens, writes survive initialization and retain the previous copy", async () => {
  saveBrowserCollection("additional", [{ id: "one" }]);
  initializeBrowserStorage();
  expect(JSON.parse(localStorage.getItem(key))).toEqual([{ id: "one" }]);
  saveBrowserCollection("additional", [{ id: "two" }]);
  const history = await browserStorageRequest("/api/backups/additional");
  await browserStorageRequest("/api/backups/additional/previous/restore", { method: "POST", body: JSON.stringify({ expectedRevision: history.currentRevision }) });
  expect(JSON.parse(localStorage.getItem(key))).toEqual([{ id: "one" }]);
});
test("old pending records survive migration", () => {
  localStorage.setItem(`${key}:pending`, '[{"id":"pending"}]');
  initializeBrowserStorage();
  expect(JSON.parse(localStorage.getItem(key))[0].id).toBe("pending");
  expect(localStorage.getItem(`${key}:pending`)).toBeNull();
});
test("another tab cannot be silently overwritten", () => {
  localStorage.setItem(key, '[{"id":"other-tab"}]');
  expect(() => saveBrowserCollection("additional", [])).toThrow(/Boshqa oynada/);
  expect(JSON.parse(localStorage.getItem(key))[0].id).toBe("other-tab");
});
test("corrupted saved records are preserved and initialization fails", () => {
  localStorage.setItem(key, "broken");
  expect(() => initializeBrowserStorage()).toThrow();
  expect(localStorage.getItem(key)).toBe("broken");
});
test("JSON import supports empty collections and does not touch the other collection", async () => {
  const main = localStorage.getItem("taminot-crm-v1");
  await browserStorageRequest("/api/storage/additional", { method: "PUT", body: JSON.stringify({ data: [], expectedRevision: null }) });
  expect(localStorage.getItem(key)).toBe("[]");
  expect(localStorage.getItem("taminot-crm-v1")).toBe(main);
});
