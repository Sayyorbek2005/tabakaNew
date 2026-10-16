const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Readable } = require("node:stream");
const { createStorageApi } = require("./storage-api.cjs");

function fixture() {
  const parent = path.resolve(__dirname, "../node_modules/.cache");
  fs.mkdirSync(parent, { recursive: true });
  const directory = fs.mkdtempSync(path.join(parent, "storage-test-"));
  const primary = path.join(directory, "data");
  const backupDirectory = path.join(directory, "mirror");
  let handler = createStorageApi(primary, { backupDirectory });
  return {
    directory: primary,
    root: directory,
    backupDirectory,
    restart() { handler = createStorageApi(primary, { backupDirectory }); },
    call(name, method = "GET", data, origin, expectedRevision) {
      return new Promise((resolve, reject) => {
        const request = Readable.from(method === "GET" ? [] : [Buffer.from(JSON.stringify({ data, expectedRevision }))]);
        request.url = name.startsWith("/") ? name : `/api/storage/${name}`;
        request.method = method;
        request.headers = { host: "localhost:3001", "content-type": "application/json", ...(origin ? { origin } : {}) };
        const response = { statusCode: 200, setHeader() {}, end(body) { resolve({ status: this.statusCode, body: JSON.parse(body) }); } };
        handler(request, response).catch(reject);
      });
    },
    cleanup() {
      assert(path.resolve(directory).startsWith(parent + path.sep));
      fs.rmSync(directory, { recursive: true, force: true });
    },
  };
}

const main = { version: 1, suppliers: [{ id: "saved" }], categories: [], products: [], payments: [], usages: [], counters: {} };
const products = [{ id: "product", payments: [{ amount: 10, method: "cash" }], usages: [{ quantity: 2 }] }];

test("opening legacy saved data creates independent backups before any edit", async () => {
  const store = fixture();
  try {
    fs.mkdirSync(store.directory, { recursive: true });
    fs.writeFileSync(path.join(store.directory, "main.json"), JSON.stringify({ data: main, savedAt: "2026-10-16" }));
    assert.deepEqual((await store.call("main")).body.data, main);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(store.backupDirectory, "main-latest.json"), "utf8")).data, main);
    assert((await store.call("/api/backups/main")).body.snapshots.length > 0);
  } finally { store.cleanup(); }
});

test("main and additional records survive restarting the storage handler", async () => {
  const store = fixture();
  try {
    assert.equal((await store.call("main")).body.exists, false);
    assert.equal((await store.call("main", "PUT", main)).status, 200);
    assert.equal((await store.call("additional", "PUT", products)).status, 200);
    store.restart();
    assert.deepEqual((await store.call("main")).body.data, main);
    assert.deepEqual((await store.call("additional")).body.data, products);
  } finally { store.cleanup(); }
});

test("backup recovers corrupt primary and an intentional clear stays cleared", async () => {
  const store = fixture();
  try {
    await store.call("additional", "PUT", products);
    fs.writeFileSync(path.join(store.directory, "additional.json"), "CORRUPTED");
    assert.deepEqual((await store.call("additional")).body.data, products);
    await store.call("additional", "PUT", [], undefined, 1);
    store.restart();
    assert.deepEqual((await store.call("additional")).body.data, []);
    fs.writeFileSync(path.join(store.directory, "additional.json"), "CORRUPTED AFTER CLEAR");
    assert.deepEqual((await store.call("additional")).body.data, []);
  } finally { store.cleanup(); }
});

test("independent backup restores all records after the project data folder is lost", async () => {
  const store = fixture();
  try {
    await store.call("main", "PUT", main);
    await store.call("additional", "PUT", products);
    const source = path.resolve(store.directory);
    const destination = path.join(store.root, "old-data");
    assert(source.startsWith(store.root + path.sep) && destination.startsWith(store.root + path.sep));
    fs.renameSync(source, destination);
    store.restart();
    assert.deepEqual((await store.call("main")).body.data, main);
    assert.deepEqual((await store.call("additional")).body.data, products);
  } finally { store.cleanup(); }
});

test("checksums reject modified JSON and stale clients cannot overwrite newer data", async () => {
  const store = fixture();
  try {
    await store.call("main", "PUT", main);
    const newer = { ...main, suppliers: [{ id: "newer" }] };
    assert.equal((await store.call("main", "PUT", newer, undefined, 1)).status, 200);
    assert.equal((await store.call("main", "PUT", main, undefined, 1)).status, 409);
    const tampered = JSON.parse(fs.readFileSync(path.join(store.directory, "main.json"), "utf8"));
    tampered.data.suppliers = [];
    fs.writeFileSync(path.join(store.directory, "main.json"), JSON.stringify(tampered));
    assert.deepEqual((await store.call("main")).body.data, newer);
  } finally { store.cleanup(); }
});

test("snapshots retain earlier states and restoring creates a new recoverable revision", async () => {
  const store = fixture();
  try {
    await store.call("additional", "PUT", products);
    await store.call("additional", "PUT", [...products, { id: "second" }], undefined, 1);
    const list = (await store.call("/api/backups/additional")).body;
    const old = list.snapshots.find((item) => item.revision === 1);
    assert(old);
    const response = await store.call(`/api/backups/additional/${old.id}/restore`, "POST", undefined, undefined, list.currentRevision);
    assert.equal(response.status, 200);
    assert.equal(response.body.revision, 3);
    assert.deepEqual((await store.call("additional")).body.data, products);
    assert((await store.call("/api/backups/additional")).body.snapshots.some((item) => item.revision === 2));
  } finally { store.cleanup(); }
});

test("invalid payloads and foreign origins cannot overwrite saved records", async () => {
  const store = fixture();
  try {
    await store.call("main", "PUT", main);
    assert.equal((await store.call("main", "PUT", [])).status, 400);
    assert.equal((await store.call("main", "PUT", main, "https://other.example")).status, 403);
    assert.deepEqual((await store.call("main")).body.data, main);
  } finally { store.cleanup(); }
});
