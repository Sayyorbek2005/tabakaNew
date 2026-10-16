# Ta’minot CRM — barcha manba kodlar

Har bir sarlavha faylning loyiha ichidagi yo‘lini ko‘rsatadi. Shu yo‘lda fayl yarating va uning kodini nusxa oling. ZIP ichida fayllar allaqachon joylashtirilgan.

Ishga tushirish: `npm install`, so‘ng `npm start`. Supabase keyingi bosqichda ulanadi.

## package.json

```json
{
  "name": "taminot-crm",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test --watchAll=false"
  },
  "eslintConfig": {
    "extends": [
      "react-app"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

## public/index.html

```html
<!doctype html>
<html lang="uz">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#174f46" />
    <meta
      name="description"
      content="Ta’minotchilar, mahsulot kirimlari va to‘lovlar hisobi"
    />
    <title>Ta’minot — hisob nazorati</title>
  </head>
  <body>
    <noscript>Ilovani ochish uchun JavaScript’ni yoqing.</noscript>
    <div id="root"></div>
  </body>
</html>
```

## src/index.jsx

```jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { StoreProvider } from "./context/StoreContext";
import "./index.css";
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </React.StrictMode>,
);
```

## src/index.css

```css
* {
  box-sizing: border-box;
}
html {
  scroll-behavior: smooth;
}
body {
  margin: 0;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  background: #f5f7f5;
  color: #233a32;
  -webkit-font-smoothing: antialiased;
}
:root {
  --green: #174f46;
  --mint: #eaf3ed;
  --ink: #233a32;
  --muted: #82928a;
  --line: #e5ebe6;
}
button,
input,
select,
textarea {
  font: inherit;
}
button {
  touch-action: manipulation;
}
input,
select,
textarea {
  border: 1px solid #dce5df;
  border-radius: 10px;
  padding: 12px 13px;
  background: white;
  color: var(--ink);
  font-size: 13px;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
input:focus,
select:focus,
textarea:focus {
  border-color: #6e9b87;
  box-shadow: 0 0 0 3px #174f4610;
}
textarea {
  resize: vertical;
}
button:focus-visible,
a:focus-visible {
  outline: 3px solid #8cb69f;
  outline-offset: 3px;
}
button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
::selection {
  background: #c7e1d2;
}
@keyframes appear {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
```

## src/App.jsx

```jsx
import { useEffect, useState } from "react";
import { useStore } from "./context/StoreContext";
import Layout, { navigation } from "./components/Layout";
import Modal from "./components/Modal";
import RecordForm from "./components/RecordForm";
import Dashboard from "./pages/Dashboard";
import Suppliers from "./pages/Suppliers";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import Payments from "./pages/Payments";
import "./App.css";
const getPage = () =>
  navigation.some((n) => n.id === window.location.hash.slice(1))
    ? window.location.hash.slice(1)
    : "dashboard";
const titles = {
  supplier: "Ta’minotchi",
  category: "Kategoriya",
  product: "Mahsulot kirimi",
  payment: "To‘lov",
};
export default function App() {
  const { data, toast, error, notify, remove, exportData } = useStore();
  const [page, setPage] = useState(getPage);
  const [form, setForm] = useState(null);
  const [deletion, setDeletion] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  useEffect(() => {
    const handler = () => setPage(getPage());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  const navigate = (id) => {
    window.location.hash = id;
    setPage(id);
    window.scrollTo({ top: 0 });
  };
  function openForm(type, record = null, supplierId = "") {
    if (
      type === "product" &&
      (!data.suppliers.length || !data.categories.length)
    ) {
      notify("Avval ta’minotchi va kategoriya yarating.");
      navigate(!data.suppliers.length ? "suppliers" : "categories");
      return;
    }
    if (type === "payment" && !data.products.length) {
      notify("Avval mahsulot kirimini yarating.");
      navigate("products");
      return;
    }
    setForm({ type, record, supplierId });
  }
  const props = {
    navigate,
    openForm,
    confirmDelete: (type, id) => {
      setDeleteError("");
      setDeletion({ type, id });
    },
  };
  return (
    <Layout page={page} navigate={navigate} onExport={exportData}>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {page === "dashboard" && <Dashboard {...props} />}{" "}
      {page === "suppliers" && <Suppliers {...props} />}{" "}
      {page === "categories" && <Categories {...props} />}{" "}
      {page === "products" && <Products {...props} />}{" "}
      {page === "payments" && <Payments {...props} />}
      {form && (
        <Modal
          title={`${titles[form.type]} ${form.record?.id ? "tahrirlash" : "qo‘shish"}`}
          onClose={() => setForm(null)}
        >
          <RecordForm {...form} onClose={() => setForm(null)} />
        </Modal>
      )}
      {deletion && (
        <Modal
          title={
            deletion.type === "payments"
              ? "To‘lovni bekor qilasizmi?"
              : "Haqiqatan o‘chirmoqchimisiz?"
          }
          onClose={() => setDeletion(null)}
        >
          <p className="confirm-text">
            {deletion.type === "payments"
              ? "Bu to‘lov tarixdan o‘chiriladi va tegishli mahsulotlar qarzi qayta hisoblanadi."
              : "Ushbu yozuv o‘chiriladi. Amalni ortga qaytarib bo‘lmaydi."}
          </p>
          {deleteError && (
            <p className="form-error" role="alert">
              {deleteError}
            </p>
          )}
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setDeletion(null)}
            >
              Bekor qilish
            </button>
            <button
              className="button destructive"
              onClick={() => {
                try {
                  remove(deletion.type, deletion.id);
                  setDeletion(null);
                } catch (e) {
                  setDeleteError(e.message);
                }
              }}
            >
              Tasdiqlash
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </Layout>
  );
}
```

## src/App.css

```css
.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  margin-bottom: 30px;
}
.eyebrow {
  font-size: 9px !important;
  letter-spacing: 2px;
  color: var(--green) !important;
  font-weight: 700;
  margin: 0 0 11px !important;
}
h1 {
  font-size: clamp(26px, 2.8vw, 35px);
  letter-spacing: -1.1px;
  margin: 0 0 10px;
  line-height: 1.2;
}
.page-heading p {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
  margin: 0;
}
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 12px 17px;
  border: 1px solid var(--green);
  border-radius: 10px;
  background: var(--green);
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: 0.2s;
  min-height: 42px;
}
.button:hover {
  background: #216355;
  box-shadow: 0 5px 14px #174f4618;
  transform: translateY(-1px);
}
.button.secondary {
  background: white;
  border-color: var(--line);
  color: var(--ink);
}
.button.secondary:hover {
  background: #edf4ef;
}
.button.small {
  padding: 9px 13px;
  font-size: 11px;
  min-height: 35px;
}
.button.destructive {
  background: #b44d3b;
  border-color: #b44d3b;
}
.icon-button {
  display: inline-grid;
  place-items: center;
  cursor: pointer;
  background: transparent;
  border: 0;
  color: var(--muted);
  border-radius: 8px;
  width: 33px;
  height: 33px;
  transition: 0.2s;
}
.icon-button:hover {
  background: var(--mint);
  color: var(--green);
}
.icon-button.danger:hover {
  color: #b44d3b;
  background: #fff0ed;
}
.text-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font: inherit;
  font-weight: 600;
  font-size: 12px;
  color: var(--green);
  background: none;
  padding: 0;
  border: 0;
  cursor: pointer;
  line-height: 1.7;
}
.text-button:hover {
  color: #39836a;
}
.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin: 0 0 18px;
}
.section-heading h2 {
  font-size: 17px;
  letter-spacing: -0.3px;
  margin: 0;
}
.section-heading p {
  color: var(--muted);
  font-size: 12px;
  margin: 7px 0 0;
}
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 22px;
}
.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 500px;
  width: 100%;
  background: white;
  border: 1px solid var(--line);
  border-radius: 11px;
  padding: 0 14px;
  color: var(--muted);
}
.search-box input {
  border: 0;
  background: none;
  box-shadow: none;
  width: 100%;
  min-width: 0;
  padding-left: 0;
}
.search-box:focus-within {
  border-color: #6e9b87;
}
.toast {
  position: fixed;
  bottom: 26px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--ink);
  color: white;
  z-index: 50;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 13px;
  box-shadow: 0 6px 30px #0002;
  max-width: 90vw;
  line-height: 1.7;
}
.confirm-text {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.8;
}
@media (max-width: 650px) {
  .page-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 17px;
  }
  .toolbar {
    flex-wrap: wrap;
  }
  .toolbar select {
    flex: 1;
    min-width: 0;
  }
  .toast {
    bottom: 80px;
  }
  .section-heading h2 {
    font-size: 15px;
  }
}
```

## src/utils/accounting.js

```javascript
export const money = (value) =>
  `${new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 2 }).format(value || 0)} so‘m`;
export const number = (value) =>
  new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 3 }).format(
    value || 0,
  );
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const round = (value) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
export const totalOf = (product) => round(product.quantity * product.price);
export const paidOf = (id, payments) =>
  round(
    payments.reduce(
      (sum, payment) =>
        sum +
        payment.allocations
          .filter((a) => a.productId === id)
          .reduce((s, a) => s + a.amount, 0),
      0,
    ),
  );
export const debtOf = (product, payments) =>
  round(totalOf(product) - paidOf(product.id, payments));
export function totals(products, payments) {
  const total = round(products.reduce((s, p) => s + totalOf(p), 0));
  const paid = round(products.reduce((s, p) => s + paidOf(p.id, payments), 0));
  return { total, paid, debt: round(total - paid) };
}
export function allocatePayment(
  products,
  payments,
  supplierId,
  productId,
  amount,
) {
  if (!Number.isFinite(amount) || amount <= 0 || round(amount) !== amount)
    throw new Error(
      "To‘lov musbat bo‘lsin va ko‘pi bilan 2 kasr xona kiriting.",
    );
  const eligible = products
    .filter(
      (p) => p.supplierId === supplierId && (!productId || p.id === productId),
    )
    .sort(
      (a, b) => a.date.localeCompare(b.date) || a.code.localeCompare(b.code),
    );
  const available = round(
    eligible.reduce((s, p) => s + debtOf(p, payments), 0),
  );
  if (amount > available)
    throw new Error(
      `To‘lov qarzdan oshmasin. Mavjud qarz: ${money(available)}`,
    );
  let remaining = amount;
  const allocations = [];
  for (const p of eligible) {
    const part = round(Math.min(remaining, debtOf(p, payments)));
    if (part > 0) {
      allocations.push({ productId: p.id, amount: part });
      remaining = round(remaining - part);
    }
    if (remaining === 0) break;
  }
  if (remaining !== 0 || allocations.length === 0)
    throw new Error("To‘lov uchun mos qarz topilmadi.");
  return allocations;
}
export function positive(value, name, decimals = 2) {
  const n = Number(value);
  if (
    !Number.isFinite(n) ||
    n <= 0 ||
    n > 1000000000000 ||
    Math.abs(n * 10 ** decimals - Math.round(n * 10 ** decimals)) > 0.0001
  )
    throw new Error(
      `${name}: musbat son kiriting (ko‘pi bilan ${decimals} kasr xona).`,
    );
  return n;
}
```

## src/utils/accounting.test.js

```javascript
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
```

## src/services/localRepository.js

```javascript
const KEY = "taminot-crm-v1";
export const emptyStore = () => ({
  version: 1,
  suppliers: [],
  categories: [],
  products: [],
  payments: [],
  counters: { supplier: 0, category: 0, product: 0, payment: 0 },
});
export function loadStore() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return emptyStore();
  const data = JSON.parse(raw);
  if (
    data.version !== 1 ||
    !["suppliers", "categories", "products", "payments"].every((k) =>
      Array.isArray(data[k]),
    ) ||
    !data.counters
  )
    throw new Error(
      "Saqlangan ma’lumot formati noto‘g‘ri. Ma’lumot avtomatik o‘chirilmaydi.",
    );
  return data;
}
export function saveStore(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
```

## src/context/StoreContext.jsx

```jsx
import { createContext, useContext, useRef, useState } from "react";
import { emptyStore, loadStore, saveStore } from "../services/localRepository";
import {
  allocatePayment,
  paidOf,
  positive,
  totalOf,
  round,
} from "../utils/accounting";
const Context = createContext(null);
export function StoreProvider({ children }) {
  const [initial] = useState(() => {
    try {
      return { data: loadStore(), error: "" };
    } catch (e) {
      return { data: emptyStore(), error: e.message };
    }
  });
  const [data, setData] = useState(initial.data);
  const current = useRef(initial.data);
  const [toast, setToast] = useState("");
  const timer = useRef(null);
  function notify(message) {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 4000);
  }
  function commit(change) {
    if (initial.error) throw new Error(initial.error);
    const next = JSON.parse(JSON.stringify(current.current));
    const result = change(next);
    try {
      saveStore(next);
    } catch (e) {
      throw new Error(
        "Saqlash amalga oshmadi. Brauzer xotirasi yoki ruxsatlarini tekshiring.",
      );
    }
    current.current = next;
    setData(next);
    return result;
  }
  const createId = (s, type, prefix) => {
    s.counters[type] += 1;
    return {
      id: crypto.randomUUID(),
      code: `${prefix}-${String(s.counters[type]).padStart(4, "0")}`,
    };
  };
  function saveSupplier(input, id) {
    commit((s) => {
      const name = input.name.trim();
      if (!name) throw new Error("Ta’minotchi nomini kiriting.");
      const values = {
        name,
        phone: input.phone.trim(),
        note: input.note.trim(),
      };
      if (id) {
        const item = s.suppliers.find((x) => x.id === id);
        if (!item) throw new Error("Ta’minotchi topilmadi.");
        Object.assign(item, values);
      } else s.suppliers.push({ ...createId(s, "supplier", "TAM"), ...values });
    });
    notify("Ta’minotchi saqlandi.");
  }
  function saveCategory(input, id) {
    commit((s) => {
      const name = input.name.trim();
      if (!name) throw new Error("Kategoriya nomini kiriting.");
      if (
        s.categories.some(
          (c) => c.id !== id && c.name.toLowerCase() === name.toLowerCase(),
        )
      )
        throw new Error("Bu kategoriya mavjud.");
      if (id)
        Object.assign(
          s.categories.find((c) => c.id === id),
          { name },
        );
      else s.categories.push({ ...createId(s, "category", "KAT"), name });
    });
    notify("Kategoriya saqlandi.");
  }
  function saveProduct(input, id) {
    commit((s) => {
      if (!input.name.trim()) throw new Error("Mahsulot nomini kiriting.");
      if (!s.suppliers.some((x) => x.id === input.supplierId))
        throw new Error("Ta’minotchini tanlang.");
      if (!s.categories.some((x) => x.id === input.categoryId))
        throw new Error("Kategoriyani tanlang.");
      if (!["kg", "litr", "dona"].includes(input.unit))
        throw new Error("Birlikni tanlang.");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date))
        throw new Error("Sanani kiriting.");
      const values = {
        name: input.name.trim(),
        supplierId: input.supplierId,
        categoryId: input.categoryId,
        unit: input.unit,
        quantity: positive(
          input.quantity,
          "Miqdor",
          input.unit === "dona" ? 0 : 3,
        ),
        price: positive(input.price, "Narx"),
        date: input.date,
        note: input.note.trim(),
      };
      if (
        totalOf(values) <= 0 ||
        totalOf(values) > Number.MAX_SAFE_INTEGER / 100
      )
        throw new Error("Jami summa hisoblash chegarasidan tashqarida.");
      if (id) {
        const item = s.products.find((x) => x.id === id);
        const paid = paidOf(id, s.payments);
        if (values.supplierId !== item.supplierId && paid > 0)
          throw new Error(
            "To‘lovli kirimning ta’minotchisini o‘zgartirib bo‘lmaydi.",
          );
        if (totalOf(values) < paid)
          throw new Error("Jami summa to‘langan summadan kam bo‘lmasin.");
        Object.assign(item, values);
      } else s.products.push({ ...createId(s, "product", "MHS"), ...values });
    });
    notify("Mahsulot kirimi saqlandi.");
  }
  function addPayment(input) {
    commit((s) => {
      const amount = round(positive(input.amount, "To‘lov"));
      if (!["cash", "card"].includes(input.method))
        throw new Error("To‘lov turini tanlang.");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date))
        throw new Error("Sanani kiriting.");
      const allocations = allocatePayment(
        s.products,
        s.payments,
        input.supplierId,
        input.productId,
        amount,
      );
      s.payments.push({
        ...createId(s, "payment", "TOL"),
        supplierId: input.supplierId,
        amount,
        method: input.method,
        date: input.date,
        note: input.note.trim(),
        allocations,
      });
    });
    notify("To‘lov qayd qilindi.");
  }
  function remove(type, id) {
    commit((s) => {
      if (
        type === "suppliers" &&
        (s.products.some((p) => p.supplierId === id) ||
          s.payments.some((p) => p.supplierId === id))
      )
        throw new Error(
          "Kirim yoki to‘lov mavjud. Ta’minotchini o‘chirib bo‘lmaydi.",
        );
      if (type === "categories" && s.products.some((p) => p.categoryId === id))
        throw new Error(
          "Kategoriyada mahsulot bor. Avval ularni boshqa kategoriyaga o‘tkazing.",
        );
      if (type === "products" && paidOf(id, s.payments) > 0)
        throw new Error(
          "Kirimda to‘lov bor. Avval tegishli to‘lovni bekor qiling.",
        );
      s[type] = s[type].filter((x) => x.id !== id);
    });
    notify(
      type === "payments"
        ? "To‘lov bekor qilindi; qarz qayta hisoblandi."
        : "Yozuv o‘chirildi.",
    );
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(current.current, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "taminot-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Context.Provider
      value={{
        data,
        toast,
        notify,
        error: initial.error,
        saveSupplier,
        saveCategory,
        saveProduct,
        addPayment,
        remove,
        exportData,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  return useContext(Context);
}
```

## src/components/EmptyState.css

```css
.empty-state {
  text-align: center;
  padding: 56px 20px;
  background: white;
  border-radius: 18px;
}
.empty-icon {
  width: 64px;
  height: 64px;
  background: var(--mint);
  color: var(--green);
  border-radius: 20px;
  display: grid;
  place-items: center;
  margin: 0 auto 18px;
}
.empty-state h3 {
  font-size: 18px;
  margin: 0 0 9px;
}
.empty-state p {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.7;
  margin: 0 auto 22px;
  max-width: 420px;
}
.empty-state .button {
  margin: auto;
}
```

## src/components/EmptyState.jsx

```jsx
import Icon from "./Icon";
import "./EmptyState.css";
export default function EmptyState({
  title,
  text,
  action,
  onAction,
  icon = "products",
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name={icon} size={28} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <button className="button" onClick={onAction}>
          <Icon name="plus" />
          {action}
        </button>
      )}
    </div>
  );
}
```

## src/components/Icon.jsx

```jsx
export default function Icon({ name, size = 20 }) {
  const paths = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    suppliers: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-4-5" />
      </>
    ),
    products: (
      <>
        <path d="m12 3 9 5v8l-9 5-9-5V8l9-5Zm0 10 9-5M12 13 3 8m9 5v8M7.5 5.5l9 5" />
      </>
    ),
    categories: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <circle cx="17.5" cy="6.5" r="3.5" />
        <path d="m6.5 14 4 7h-8l4-7Z" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    payments: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <path d="M2 10h20M6 15h4" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    edit: (
      <>
        <path d="m15 4 5 5-11 11-6 1 1-6L15 4ZM13 6l5 5" />
      </>
    ),
    delete: (
      <>
        <path d="M3 6h18M8 6V3h8v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" />
      </>
    ),
    search: (
      <>
        <circle cx="10" cy="10" r="6" />
        <path d="m15 15 6 6" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    debt: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6m0 4h.01" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.products}
    </svg>
  );
}
```

## src/components/Layout.css

```css
.app-shell {
  display: flex;
  min-height: 100dvh;
}
.sidebar {
  width: 246px;
  background: white;
  border-right: 1px solid var(--line);
  position: fixed;
  inset: 0 auto 0 0;
  padding: 34px 20px;
  display: flex;
  flex-direction: column;
  z-index: 10;
}
.brand {
  display: flex;
  gap: 12px;
  align-items: center;
  text-decoration: none;
  color: var(--ink);
  font-size: 27px;
  font-weight: 750;
  letter-spacing: -1px;
  padding: 0 9px;
}
.brand-symbol {
  background: var(--green);
  width: 42px;
  height: 45px;
  border-radius: 13px;
  color: white;
  display: grid;
  place-items: center;
}
.brand-dot {
  color: var(--green);
}
.brand small {
  display: block;
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 2px;
  margin-top: 3px;
  color: var(--muted);
}
.nav-caption {
  font-size: 10px;
  color: #94a19d;
  letter-spacing: 1.6px;
  margin: 50px 14px 18px;
}
.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 14px 15px;
  border-radius: 11px;
  border: 0;
  background: none;
  color: #72837d;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  margin-bottom: 7px;
  text-align: left;
  transition: 0.2s;
}
.nav-item:hover {
  background: #f5f8f6;
  color: var(--green);
}
.nav-item.active {
  background: var(--mint);
  color: var(--green);
  font-weight: 650;
}
.sidebar-bottom {
  margin-top: auto;
  display: flex;
  gap: 10px;
  font-size: 11px;
  color: var(--ink);
  padding: 18px 10px 0;
  border-top: 1px solid var(--line);
  line-height: 1.6;
}
.sidebar-bottom small {
  display: block;
  color: var(--muted);
  font-size: 10px;
}
.local-dot {
  background: #409878;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}
.main-shell {
  margin-left: 246px;
  width: calc(100% - 246px);
}
.topbar {
  height: 82px;
  border-bottom: 1px solid var(--line);
  background: #ffffffa0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 38px;
  gap: 15px;
}
.breadcrumb {
  font-size: 12px;
  color: var(--muted);
}
.breadcrumb span {
  margin: 0 14px;
  color: #bac7c1;
}
.breadcrumb strong {
  color: var(--ink);
  font-weight: 500;
}
main {
  padding: 36px 38px;
  max-width: 1700px;
  margin: auto;
}
.app-footer {
  padding: 4px 38px 28px;
  color: #9ba7a2;
  font-size: 11px;
}
@media (max-width: 900px) {
  .sidebar {
    width: 84px;
    padding: 25px 13px;
  }
  .brand {
    padding: 0;
    justify-content: center;
  }
  .brand > span:last-child,
  .nav-item span,
  .nav-caption,
  .sidebar-bottom {
    display: none;
  }
  .nav-item {
    justify-content: center;
    padding: 14px 0;
  }
  .sidebar nav {
    margin-top: 38px;
  }
  .main-shell {
    margin-left: 84px;
    width: calc(100% - 84px);
  }
  main {
    padding: 26px 22px;
  }
  .topbar {
    padding: 0 22px;
  }
}
@media (max-width: 600px) {
  .sidebar {
    inset: auto 0 0;
    width: 100%;
    height: 68px;
    padding: 5px 9px;
    border-right: 0;
    border-top: 1px solid var(--line);
    background: #fffffff2;
    backdrop-filter: blur(8px);
  }
  .brand {
    display: none;
  }
  .sidebar nav {
    display: flex;
    margin: 0;
    gap: 4px;
    justify-content: space-around;
  }
  .nav-item {
    width: 52px;
    padding: 13px 0;
    margin: 0;
  }
  .main-shell {
    margin-left: 0;
    width: 100%;
    padding-bottom: 70px;
  }
  .topbar {
    height: 65px;
    padding: 0 16px;
  }
  .breadcrumb {
    font-size: 10px;
  }
  .breadcrumb span {
    margin: 0 7px;
  }
  .export-button span {
    display: none;
  }
  main {
    padding: 24px 16px;
  }
  .app-footer {
    padding-left: 16px;
  }
}
```

## src/components/Layout.jsx

```jsx
import Icon from "./Icon";
import "./Layout.css";
export const navigation = [
  { id: "dashboard", label: "Umumiy ko‘rinish", icon: "dashboard" },
  { id: "suppliers", label: "Ta’minotchilar", icon: "suppliers" },
  { id: "products", label: "Mahsulotlar", icon: "products" },
  { id: "categories", label: "Kategoriyalar", icon: "categories" },
  { id: "payments", label: "To‘lovlar", icon: "payments" },
];
export default function Layout({ page, navigate, children, onExport }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            navigate("dashboard");
          }}
        >
          <span className="brand-symbol">
            <Icon name="products" size={25} />
          </span>
          <span>
            ta’minot<span className="brand-dot">.</span>
            <small>HISOB NAZORATI</small>
          </span>
        </a>
        <div className="nav-caption">ISH MAYDONI</div>
        <nav>
          {navigation.map((n) => (
            <button
              key={n.id}
              aria-label={n.label}
              className={`nav-item ${page === n.id ? "active" : ""}`}
              onClick={() => navigate(n.id)}
              aria-current={page === n.id ? "page" : undefined}
            >
              <Icon name={n.icon} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-dot" />
          <span>
            Brauzerda saqlanmoqda<small>Supabase keyingi bosqichda</small>
          </span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span className="breadcrumb">
            Ish maydoni <span>/</span>{" "}
            <strong>{navigation.find((n) => n.id === page)?.label}</strong>
          </span>
          <button className="button secondary export-button" onClick={onExport}>
            <Icon name="download" size={17} />
            <span>Nusxa olish</span>
          </button>
        </header>
        <main>{children}</main>
        <footer className="app-footer">
          Ta’minot · Sodda hisob, aniq nazorat.
        </footer>
      </div>
    </div>
  );
}
```

## src/components/Modal.css

```css
.modal {
  border: 0;
  border-radius: 22px;
  padding: 28px;
  width: min(580px, calc(100% - 32px));
  max-height: 90dvh;
  color: var(--ink);
  box-shadow: 0 30px 100px #162c3440;
  animation: appear 0.2s ease;
}
.modal::backdrop {
  background: #112e2b65;
  backdrop-filter: blur(4px);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.modal-header h2 {
  font-size: 22px;
  margin: 0;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}
.field.wide {
  grid-column: 1/-1;
}
.field input,
.field select,
.field textarea {
  width: 100%;
}
.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 24px;
}
.form-error {
  background: #fff0ed;
  color: #a43e2c;
  border-radius: 12px;
  padding: 12px;
  font-size: 13px;
  margin: 16px 0 0;
}
.form-preview {
  grid-column: 1/-1;
  padding: 16px;
  border-radius: 12px;
  background: var(--mint);
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.form-preview strong {
  color: var(--green);
}
.form-hint {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.7;
  margin: 14px 0 0;
}
@media (max-width: 520px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .modal {
    padding: 20px;
  }
}
```

## src/components/Modal.jsx

```jsx
import { useEffect, useRef, useId } from "react";
import Icon from "./Icon";
import "./Modal.css";
export default function Modal({ title, children, onClose }) {
  const dialog = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const el = dialog.current;
    el.showModal();
    return () => {
      el.close();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialog.current) {
          const r = dialog.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-header">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Yopish"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
```

## src/components/ProductTable.css

```css
.table-wrap {
  overflow-x: auto;
  background: white;
  border: 1px solid var(--line);
  border-radius: 16px;
}
table {
  border-collapse: collapse;
  width: 100%;
  text-align: left;
  font-size: 13px;
}
th {
  padding: 16px 18px;
  color: var(--muted);
  font-weight: 500;
  background: #fbfcfb;
  white-space: nowrap;
  border-bottom: 1px solid var(--line);
}
td {
  padding: 18px;
  border-bottom: 1px solid var(--line);
}
tr:last-child td {
  border-bottom: 0;
}
tbody tr:hover {
  background: #f8fbf9;
}
td strong {
  font-weight: 600;
}
.code {
  display: block;
  margin-top: 6px;
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 0.5px;
}
.nowrap {
  white-space: nowrap;
}
.green {
  color: var(--green);
}
.debt-text {
  color: #b36b33;
}
.pill {
  display: inline-flex;
  background: #f1f4f3;
  color: #60756f;
  font-size: 11px;
  padding: 5px 9px;
  border-radius: 7px;
  white-space: nowrap;
}
.row-actions {
  display: flex;
  gap: 3px;
}
.table-footer {
  display: flex;
  gap: 20px;
  justify-content: flex-end;
  padding: 20px;
  color: var(--muted);
  font-size: 13px;
  flex-wrap: wrap;
}
.table-footer strong {
  color: var(--ink);
  margin-left: 8px;
}
```

## src/components/ProductTable.jsx

```jsx
import { useStore } from "../context/StoreContext";
import { debtOf, money, number, paidOf, totalOf } from "../utils/accounting";
import Icon from "./Icon";
import EmptyState from "./EmptyState";
import "./ProductTable.css";
export default function ProductTable({ products, onEdit, onDelete, onPay }) {
  const { data } = useStore();
  if (!products.length)
    return (
      <EmptyState
        title="Kirimlar topilmadi"
        text="Yangi mahsulot qo‘shing yoki qidiruv va filtrlarni o‘zgartiring."
      />
    );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Mahsulot / ID</th>
            <th>Ta’minotchi</th>
            <th>Kategoriya</th>
            <th>Miqdor</th>
            <th>Birlik narxi</th>
            <th>Jami</th>
            <th>To‘langan</th>
            <th>Qarz</th>
            <th>Sana</th>
            {onEdit && <th>Amallar</th>}
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                <strong>{p.name}</strong>
                <small className="code">{p.code}</small>
              </td>
              <td>{data.suppliers.find((s) => s.id === p.supplierId)?.name}</td>
              <td>
                <span className="pill">
                  {data.categories.find((c) => c.id === p.categoryId)?.name}
                </span>
              </td>
              <td>
                {number(p.quantity)} {p.unit}
              </td>
              <td>{money(p.price)}</td>
              <td className="nowrap">
                <strong>{money(totalOf(p))}</strong>
              </td>
              <td className="green nowrap">
                {money(paidOf(p.id, data.payments))}
              </td>
              <td className="nowrap">
                <span
                  className={
                    debtOf(p, data.payments) > 0 ? "debt-text" : "green"
                  }
                >
                  {money(debtOf(p, data.payments))}
                </span>
              </td>
              <td className="nowrap">{p.date}</td>
              {onEdit && (
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      title="Tahrirlash"
                      aria-label={`${p.name}: tahrirlash`}
                      onClick={() => onEdit(p)}
                    >
                      <Icon name="edit" size={17} />
                    </button>
                    {debtOf(p, data.payments) > 0 && (
                      <button
                        className="icon-button"
                        title="To‘lov"
                        aria-label={`${p.name}: to‘lov`}
                        onClick={() => onPay(p)}
                      >
                        <Icon name="payments" size={17} />
                      </button>
                    )}
                    <button
                      className="icon-button danger"
                      title="O‘chirish"
                      aria-label={`${p.name}: o‘chirish`}
                      onClick={() => onDelete(p.id)}
                    >
                      <Icon name="delete" size={17} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## src/components/RecordForm.jsx

```jsx
import { useState } from "react";
import { useStore } from "../context/StoreContext";
import { debtOf, money, today, totalOf } from "../utils/accounting";
export default function RecordForm({ type, record, onClose, supplierId = "" }) {
  const { data, saveSupplier, saveCategory, saveProduct, addPayment } =
    useStore();
  const [values, setValues] = useState({
    name: "",
    phone: "",
    note: "",
    supplierId,
    categoryId: "",
    unit: "kg",
    quantity: "",
    price: "",
    date: today(),
    productId: "",
    amount: "",
    method: "cash",
    ...record,
  });
  const [error, setError] = useState("");
  const field = (key, label, props = {}) => (
    <label className={`field ${props.wide ? "wide" : ""}`}>
      {label}
      <input
        {...props}
        wide={undefined}
        value={values[key]}
        onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
      />
    </label>
  );
  const select = (key, label, options, required = true) => (
    <label className="field">
      {label}
      <select
        aria-label={label}
        required={required}
        value={values[key]}
        onChange={(e) =>
          setValues((v) => ({
            ...v,
            [key]: e.target.value,
            ...(key === "supplierId" ? { productId: "" } : {}),
          }))
        }
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
  const suppliers = [
    { value: "", label: "Ta’minotchini tanlang" },
    ...data.suppliers.map((s) => ({ value: s.id, label: s.name })),
  ];
  const products = data.products.filter(
    (p) => p.supplierId === values.supplierId && debtOf(p, data.payments) > 0,
  );
  const available = products
    .filter((p) => !values.productId || p.id === values.productId)
    .reduce((s, p) => s + debtOf(p, data.payments), 0);
  function submit(e) {
    e.preventDefault();
    setError("");
    try {
      if (type === "supplier") saveSupplier(values, record?.id);
      if (type === "category") saveCategory(values, record?.id);
      if (type === "product") saveProduct(values, record?.id);
      if (type === "payment") addPayment(values);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <form onSubmit={submit}>
      <div className="form-grid">
        {(type === "supplier" || type === "category" || type === "product") &&
          field("name", type === "product" ? "Mahsulot nomi" : "Nomi", {
            required: true,
            maxLength: 120,
            autoFocus: true,
            wide: true,
            placeholder:
              type === "product" ? "Masalan, bug‘doy uni" : "Nomini kiriting",
          })}
        {type === "supplier" &&
          field("phone", "Telefon", {
            type: "tel",
            maxLength: 30,
            placeholder: "+998 90 123 45 67",
            wide: true,
          })}
        {type === "product" && (
          <>
            {select("supplierId", "Ta’minotchi", suppliers)}
            {select("categoryId", "Kategoriya", [
              { value: "", label: "Kategoriyani tanlang" },
              ...data.categories.map((c) => ({ value: c.id, label: c.name })),
            ])}
            {select("unit", "O‘lchov birligi", [
              { value: "kg", label: "Kilogramm (kg)" },
              { value: "litr", label: "Litr" },
              { value: "dona", label: "Dona" },
            ])}
            {field("quantity", "Miqdor", {
              type: "number",
              min: values.unit === "dona" ? "1" : "0.001",
              step: values.unit === "dona" ? "1" : "0.001",
              required: true,
            })}
            {field("price", "1 birlik narxi (so‘m)", {
              type: "number",
              min: "0.01",
              step: "0.01",
              required: true,
            })}
            {field("date", "Kirim sanasi", { type: "date", required: true })}
            <div className="form-preview">
              <span>Kirim summasi</span>
              <strong>
                {money(
                  totalOf({
                    quantity: Number(values.quantity),
                    price: Number(values.price),
                  }),
                )}
              </strong>
            </div>
          </>
        )}
        {type === "payment" && (
          <>
            {select("supplierId", "Ta’minotchi", suppliers)}
            {select(
              "productId",
              "Qaysi kirim uchun?",
              [
                { value: "", label: "Barcha qarzlar (eski kirimdan)" },
                ...products.map((p) => ({
                  value: p.id,
                  label: `${p.code} · ${p.name}`,
                })),
              ],
              false,
            )}
            {field("amount", "To‘lov summasi (so‘m)", {
              type: "number",
              min: "0.01",
              max: available,
              step: "0.01",
              required: true,
            })}
            {select("method", "To‘lov usuli", [
              { value: "cash", label: "Naqd" },
              { value: "card", label: "Karta" },
            ])}
            {field("date", "To‘lov sanasi", {
              type: "date",
              required: true,
              wide: true,
            })}
            <div className="form-preview">
              <span>Mavjud qarz</span>
              <strong>{money(available)}</strong>
            </div>
          </>
        )}
        {type !== "category" && (
          <label className="field wide">
            Izoh (ixtiyoriy)
            <textarea
              maxLength={500}
              rows={3}
              value={values.note}
              onChange={(e) =>
                setValues((v) => ({ ...v, note: e.target.value }))
              }
            />
          </label>
        )}
      </div>
      {type === "payment" && (
        <p className="form-hint">
          Bu bo‘lim amalga oshirilgan to‘lovni qayd qiladi. Umumiy to‘lov eng
          eski qarzli kirimlardan boshlab taqsimlanadi.
        </p>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button type="button" className="button secondary" onClick={onClose}>
          Bekor qilish
        </button>
        <button className="button" type="submit">
          {type === "payment" ? "To‘lovni qayd qilish" : "Saqlash"}
        </button>
      </div>
    </form>
  );
}
```

## src/components/StatCard.css

```css
.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 26px;
}
.stat-card {
  background: white;
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 22px;
  min-width: 0;
  transition: transform 0.2s;
}
.stat-card:hover {
  transform: translateY(-3px);
}
.stat-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  color: var(--muted);
  font-size: 13px;
}
.stat-icon {
  width: 36px;
  height: 36px;
  background: var(--mint);
  color: var(--green);
  border-radius: 11px;
  display: grid;
  place-items: center;
}
.stat-card strong {
  display: block;
  font-size: clamp(20px, 2vw, 29px);
  letter-spacing: -0.7px;
  margin: 17px 0 10px;
  overflow-wrap: anywhere;
}
.stat-card small {
  color: var(--muted);
  font-size: 12px;
}
.stat-card.accent {
  background: var(--green);
  color: white;
  border-color: var(--green);
}
.stat-card.accent .stat-top,
.stat-card.accent small {
  color: #c0d7d0;
}
.stat-card.accent .stat-icon {
  background: #ffffff20;
  color: white;
}
.stat-card.warning .stat-icon {
  background: #fff2df;
  color: #a87327;
}
@media (max-width: 1100px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 520px) {
  .stat-card {
    padding: 16px;
  }
  .stat-card strong {
    font-size: 20px;
  }
}
```

## src/components/StatCard.jsx

```jsx
import Icon from "./Icon";
import "./StatCard.css";
export default function StatCard({ label, value, hint, icon, tone = "" }) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-top">
        <span>{label}</span>
        <div className="stat-icon">
          <Icon name={icon} />
        </div>
      </div>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}
```

## src/pages/Categories.css

```css
.category-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}
.category-card {
  background: white;
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 22px;
}
.category-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
}
.category-icon {
  width: 50px;
  height: 50px;
  background: var(--mint);
  color: var(--green);
  border-radius: 15px;
  display: grid;
  place-items: center;
}
.category-card h2 {
  font-size: 20px;
  margin: 10px 0;
  overflow-wrap: anywhere;
}
.category-card p {
  color: var(--muted);
  font-size: 12px;
}
.category-total {
  padding-top: 18px;
  border-top: 1px solid var(--line);
  margin-top: 23px;
  font-size: 12px;
  color: var(--muted);
}
.category-total strong {
  display: block;
  margin-top: 9px;
  font-size: 19px;
  color: var(--ink);
  overflow-wrap: anywhere;
}
@media (max-width: 1100px) {
  .category-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 650px) {
  .category-grid {
    grid-template-columns: 1fr;
  }
}
```

## src/pages/Categories.jsx

```jsx
import { useStore } from "../context/StoreContext";
import { money, totals } from "../utils/accounting";
import Icon from "../components/Icon";
import EmptyState from "../components/EmptyState";
import "./Categories.css";
export default function Categories({ openForm, confirmDelete }) {
  const { data } = useStore();
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">TARTIB VA GURUHLASH</p>
          <h1>Kategoriyalar</h1>
          <p>Mahsulotlarni o‘zingiz yaratgan kategoriyalarga ajrating.</p>
        </div>
        <button className="button" onClick={() => openForm("category")}>
          <Icon name="plus" />
          Kategoriya qo‘shish
        </button>
      </div>
      {!data.categories.length ? (
        <EmptyState
          icon="categories"
          title="Birinchi kategoriyani yarating"
          text="Masalan: un mahsulotlari, yog‘lar yoki ichimliklar."
          action="Kategoriya qo‘shish"
          onAction={() => openForm("category")}
        />
      ) : (
        <div className="category-grid">
          {data.categories.map((c) => {
            const products = data.products.filter((p) => p.categoryId === c.id);
            const sums = totals(products, data.payments);
            return (
              <article className="category-card" key={c.id}>
                <div className="category-top">
                  <span className="category-icon">
                    <Icon name="categories" size={24} />
                  </span>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      aria-label={`${c.name}: tahrirlash`}
                      onClick={() => openForm("category", c)}
                    >
                      <Icon name="edit" size={17} />
                    </button>
                    <button
                      className="icon-button danger"
                      aria-label={`${c.name}: o‘chirish`}
                      onClick={() => confirmDelete("categories", c.id)}
                    >
                      <Icon name="delete" size={17} />
                    </button>
                  </div>
                </div>
                <small className="code">{c.code}</small>
                <h2>{c.name}</h2>
                <p>{products.length} ta mahsulot kirimi</p>
                <div className="category-total">
                  Jami summa<strong>{money(sums.total)}</strong>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
```

## src/pages/Dashboard.css

```css
.overview-grid {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}
.panel {
  border: 1px solid var(--line);
  border-radius: 18px;
  background: white;
  padding: 24px;
}
.payment-summary .section-heading {
  margin: 0 0 26px;
}
.payment-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.payment-split strong {
  display: block;
  margin-top: 12px;
  font-size: 22px;
  overflow-wrap: anywhere;
}
.payment-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 12px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.cash {
  background: var(--green);
}
.card {
  background: #bad8c9;
}
.split-bar {
  height: 9px;
  border-radius: 10px;
  background: #dcebe3;
  overflow: hidden;
  margin: 25px 0 18px;
}
.split-bar span {
  display: block;
  height: 100%;
  background: var(--green);
}
.quick-card {
  padding: 25px;
  border-radius: 18px;
  background: #e9efe6;
  border: 1px solid #dce6d9;
}
.quick-icon {
  color: var(--green);
}
.quick-card h2 {
  font-size: 22px;
  letter-spacing: -0.4px;
  margin: 13px 0 10px;
}
.quick-card p {
  color: #6e7f71;
  font-size: 13px;
  line-height: 1.8;
  margin-bottom: 20px;
  max-width: 350px;
}
@media (max-width: 700px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
  .payment-split strong {
    font-size: 18px;
  }
}
```

## src/pages/Dashboard.jsx

```jsx
import { useStore } from "../context/StoreContext";
import { money, totals, number } from "../utils/accounting";
import StatCard from "../components/StatCard";
import ProductTable from "../components/ProductTable";
import Icon from "../components/Icon";
import "./Dashboard.css";
export default function Dashboard({ navigate, openForm }) {
  const { data } = useStore();
  const sums = totals(data.products, data.payments);
  const cash = data.payments
    .filter((p) => p.method === "cash")
    .reduce((s, p) => s + p.amount, 0);
  const card = data.payments
    .filter((p) => p.method === "card")
    .reduce((s, p) => s + p.amount, 0);
  const recent = [...data.products]
    .sort(
      (a, b) => b.date.localeCompare(a.date) || b.code.localeCompare(a.code),
    )
    .slice(0, 5);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">BARCHASI NAZORATDA</p>
          <h1>Umumiy ko‘rinish</h1>
          <p>Kirimlar, to‘lovlar va qarzlar — bitta joyda.</p>
        </div>
        <button className="button" onClick={() => openForm("product")}>
          <Icon name="plus" />
          Yangi kirim
        </button>
      </div>
      <div className="stats">
        <StatCard
          label="Jami kirim summasi"
          value={money(sums.total)}
          hint={`${data.products.length} ta mahsulot kirimi`}
          icon="products"
          tone="accent"
        />
        <StatCard
          label="Jami to‘langan"
          value={money(sums.paid)}
          hint={`${data.payments.length} ta to‘lov qayd qilingan`}
          icon="payments"
        />
        <StatCard
          label="Jami qarzimiz"
          value={money(sums.debt)}
          hint="Ta’minotchilarga qolgan qarz"
          icon="debt"
          tone="warning"
        />
        <StatCard
          label="Ta’minotchilar"
          value={number(data.suppliers.length)}
          hint={`${data.categories.length} ta kategoriya`}
          icon="suppliers"
        />
      </div>
      <div className="overview-grid">
        <section className="panel payment-summary">
          <div className="section-heading">
            <h2>To‘lovlar taqsimoti</h2>
            <span className="pill">Barcha vaqt</span>
          </div>
          <div className="payment-split">
            <div>
              <span className="payment-label">
                <span className="dot cash" />
                Naqd
              </span>
              <strong>{money(cash)}</strong>
            </div>
            <div>
              <span className="payment-label">
                <span className="dot card" />
                Karta
              </span>
              <strong>{money(card)}</strong>
            </div>
          </div>
          <div
            className="split-bar"
            aria-label="Naqd va karta to‘lovlari nisbati"
          >
            <span
              style={{ width: `${sums.paid ? (cash / sums.paid) * 100 : 0}%` }}
            />
          </div>
          <button className="text-button" onClick={() => navigate("payments")}>
            To‘lovlarni ko‘rish <Icon name="arrow" size={17} />
          </button>
        </section>
        <section className="quick-card">
          <span className="quick-icon">
            <Icon name="suppliers" size={27} />
          </span>
          <h2>Ishni tartibli boshlang.</h2>
          <p>
            Avval ta’minotchi va kategoriya yarating, keyin mahsulot kirimini
            qayd qiling.
          </p>
          <button className="text-button" onClick={() => navigate("suppliers")}>
            Ta’minotchilar <Icon name="arrow" size={17} />
          </button>
        </section>
      </div>
      <div className="section-heading">
        <div>
          <h2>Oxirgi kirimlar</h2>
          <p>Eng yangi 5 ta mahsulot kirimi</p>
        </div>
        <button className="text-button" onClick={() => navigate("products")}>
          Barchasi <Icon name="arrow" size={17} />
        </button>
      </div>
      <ProductTable products={recent} />
    </>
  );
}
```

## src/pages/Payments.css

```css
.payment-stats {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.method-pill {
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 8px;
  white-space: nowrap;
}
.method-pill.cash {
  color: var(--green);
  background: var(--mint);
}
.method-pill.card {
  color: #62638c;
  background: #eeedf8;
}
.allocation {
  display: block;
  font-size: 11px;
  white-space: nowrap;
  line-height: 1.8;
  color: var(--muted);
}
.payment-note {
  min-width: 120px;
  max-width: 240px;
  overflow-wrap: anywhere;
}
@media (max-width: 700px) {
  .payment-stats {
    grid-template-columns: 1fr;
  }
}
```

## src/pages/Payments.jsx

```jsx
import { useState } from "react";
import { useStore } from "../context/StoreContext";
import { money } from "../utils/accounting";
import Icon from "../components/Icon";
import EmptyState from "../components/EmptyState";
import StatCard from "../components/StatCard";
import "./Payments.css";
export default function Payments({ openForm, confirmDelete }) {
  const { data } = useStore();
  const [method, setMethod] = useState("");
  const [supplier, setSupplier] = useState("");
  const items = data.payments
    .filter(
      (p) =>
        (!method || p.method === method) &&
        (!supplier || p.supplierId === supplier),
    )
    .slice()
    .reverse();
  const sum = (filter) =>
    items.filter(filter).reduce((s, p) => s + p.amount, 0);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">TO‘LOV TARIXI</p>
          <h1>To‘lovlar</h1>
          <p>Ta’minotchilarga amalga oshirilgan to‘lovlarni qayd qiling.</p>
        </div>
        <button className="button" onClick={() => openForm("payment")}>
          <Icon name="plus" />
          To‘lov qo‘shish
        </button>
      </div>
      <div className="stats payment-stats">
        <StatCard
          label="Jami to‘lov"
          value={money(sum(() => true))}
          hint={`${items.length} ta to‘lov · joriy filtr`}
          icon="payments"
          tone="accent"
        />
        <StatCard
          label="Naqd to‘lovlar"
          value={money(sum((p) => p.method === "cash"))}
          hint="Joriy filtr bo‘yicha"
          icon="payments"
        />
        <StatCard
          label="Karta to‘lovlari"
          value={money(sum((p) => p.method === "card"))}
          hint="Joriy filtr bo‘yicha"
          icon="payments"
        />
      </div>
      <div className="toolbar">
        <select
          aria-label="To‘lov usuli filtri"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          <option value="">Barcha to‘lov usullari</option>
          <option value="cash">Naqd</option>
          <option value="card">Karta</option>
        </select>
        <select
          aria-label="Ta’minotchi filtri"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
        >
          <option value="">Barcha ta’minotchilar</option>
          {data.suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      {!items.length ? (
        <EmptyState
          icon="payments"
          title="To‘lovlar topilmadi"
          text="Avval mahsulot kirimini qo‘shing, so‘ng unga to‘lov qayd qiling."
        />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>To‘lov ID / sana</th>
                <th>Ta’minotchi</th>
                <th>Usul</th>
                <th>Summa</th>
                <th>Taqsimlangan kirimlar</th>
                <th>Izoh</th>
                <th>Amal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.code}</strong>
                    <small className="code">{p.date}</small>
                  </td>
                  <td>
                    {data.suppliers.find((s) => s.id === p.supplierId)?.name}
                  </td>
                  <td>
                    <span className={`method-pill ${p.method}`}>
                      {p.method === "cash" ? "Naqd" : "Karta"}
                    </span>
                  </td>
                  <td className="green nowrap">
                    <strong>{money(p.amount)}</strong>
                  </td>
                  <td>
                    {p.allocations.map((a) => (
                      <small className="allocation" key={a.productId}>
                        {data.products.find((x) => x.id === a.productId)?.code}{" "}
                        · {money(a.amount)}
                      </small>
                    ))}
                  </td>
                  <td className="payment-note">{p.note || "—"}</td>
                  <td>
                    <button
                      className="icon-button danger"
                      aria-label={`${p.code}: bekor qilish`}
                      title="To‘lovni bekor qilish"
                      onClick={() => confirmDelete("payments", p.id)}
                    >
                      <Icon name="delete" size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
```

## src/pages/Products.css

```css
.product-filters {
  flex-wrap: wrap;
}
.product-filters .search-box {
  flex: 1;
  min-width: 220px;
}
.product-filters select {
  min-width: 180px;
}
@media (max-width: 650px) {
  .product-filters select,
  .product-filters .search-box {
    width: 100%;
    min-width: 0;
  }
}
```

## src/pages/Products.jsx

```jsx
import { useState } from "react";
import { useStore } from "../context/StoreContext";
import { totals, money } from "../utils/accounting";
import Icon from "../components/Icon";
import ProductTable from "../components/ProductTable";
import "./Products.css";
export default function Products({ openForm, confirmDelete }) {
  const { data } = useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [supplier, setSupplier] = useState("");
  const items = data.products
    .filter(
      (p) =>
        `${p.name} ${p.code}`.toLowerCase().includes(query.toLowerCase()) &&
        (!category || p.categoryId === category) &&
        (!supplier || p.supplierId === supplier),
    )
    .slice()
    .reverse();
  const sums = totals(items, data.payments);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">KIRIMLAR REYESTRI</p>
          <h1>Mahsulotlar</h1>
          <p>
            {data.products.length} ta mahsulot kirimi · kg, litr va dona
            hisobida.
          </p>
        </div>
        <button className="button" onClick={() => openForm("product")}>
          <Icon name="plus" />
          Mahsulot qo‘shish
        </button>
      </div>
      <div className="toolbar product-filters">
        <label className="search-box">
          <Icon name="search" />
          <input
            aria-label="Mahsulot qidirish"
            placeholder="Mahsulot nomi yoki ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Kategoriya filtri"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Barcha kategoriyalar</option>
          {data.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Ta’minotchi filtri"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
        >
          <option value="">Barcha ta’minotchilar</option>
          {data.suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <ProductTable
        products={items}
        onEdit={(p) => openForm("product", p)}
        onDelete={(id) => confirmDelete("products", id)}
        onPay={(p) =>
          openForm("payment", { supplierId: p.supplierId, productId: p.id })
        }
      />
      <div className="table-footer">
        <span>{items.length} ta kirim</span>
        <span>
          Jami <strong>{money(sums.total)}</strong>
        </span>
        <span>
          To‘langan <strong>{money(sums.paid)}</strong>
        </span>
        <span>
          Qarz <strong>{money(sums.debt)}</strong>
        </span>
      </div>
    </>
  );
}
```

## src/pages/Suppliers.css

```css
.supplier-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}
.supplier-card {
  border: 1px solid var(--line);
  background: white;
  border-radius: 18px;
  padding: 22px;
}
.supplier-card.selected {
  border-color: var(--green);
}
.supplier-top {
  display: flex;
  gap: 12px;
  align-items: center;
}
.supplier-top > div:nth-child(2) {
  flex: 1;
  min-width: 0;
}
.supplier-top h2 {
  font-size: 17px;
  margin: 0 0 6px;
  overflow-wrap: anywhere;
}
.supplier-top small {
  font-size: 11px;
  color: var(--muted);
}
.avatar {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background: var(--mint);
  color: var(--green);
  border-radius: 14px;
  font-weight: 650;
}
.supplier-card dl {
  margin: 22px 0;
}
.supplier-card dl > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 13px;
  font-size: 13px;
}
.supplier-card dt {
  color: var(--muted);
}
.supplier-card dd {
  font-weight: 600;
  margin: 0;
  text-align: right;
}
.supplier-actions {
  border-top: 1px solid var(--line);
  padding-top: 16px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}
.supplier-note {
  font-size: 12px;
  line-height: 1.7;
  color: var(--muted);
  overflow-wrap: anywhere;
}
.supplier-detail {
  margin-top: 30px;
}
@media (max-width: 1100px) {
  .supplier-grid {
    grid-template-columns: 1fr;
  }
}
```

## src/pages/Suppliers.jsx

```jsx
import { useState } from "react";
import { useStore } from "../context/StoreContext";
import { money, totals } from "../utils/accounting";
import Icon from "../components/Icon";
import EmptyState from "../components/EmptyState";
import ProductTable from "../components/ProductTable";
import "./Suppliers.css";
export default function Suppliers({ openForm, confirmDelete }) {
  const { data } = useStore();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const items = data.suppliers.filter((s) =>
    `${s.name} ${s.phone} ${s.code}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const supplier = data.suppliers.find((s) => s.id === selected);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">HAMKORLAR</p>
          <h1>Ta’minotchilar</h1>
          <p>
            {data.suppliers.length} ta ta’minotchi · har birining hisobi
            alohida.
          </p>
        </div>
        <button className="button" onClick={() => openForm("supplier")}>
          <Icon name="plus" />
          Ta’minotchi qo‘shish
        </button>
      </div>
      <div className="toolbar">
        <label className="search-box">
          <Icon name="search" />
          <input
            aria-label="Ta’minotchi qidirish"
            placeholder="Ism, ID yoki telefon bo‘yicha qidirish"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      {!items.length ? (
        <EmptyState
          icon="suppliers"
          title="Ta’minotchilar topilmadi"
          text="Mahsulot olib keladigan ta’minotchilarni qo‘shing."
          action="Ta’minotchi qo‘shish"
          onAction={() => openForm("supplier")}
        />
      ) : (
        <div className="supplier-grid">
          {items.map((s) => {
            const products = data.products.filter((p) => p.supplierId === s.id);
            const sums = totals(products, data.payments);
            return (
              <article
                className={`supplier-card ${selected === s.id ? "selected" : ""}`}
                key={s.id}
              >
                <div className="supplier-top">
                  <span className="avatar">
                    {s.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <h2>{s.name}</h2>
                    <small>
                      {s.code} · {s.phone || "Telefon kiritilmagan"}
                    </small>
                  </div>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      aria-label={`${s.name}: tahrirlash`}
                      onClick={() => openForm("supplier", s)}
                    >
                      <Icon name="edit" size={16} />
                    </button>
                    <button
                      className="icon-button danger"
                      aria-label={`${s.name}: o‘chirish`}
                      onClick={() => confirmDelete("suppliers", s.id)}
                    >
                      <Icon name="delete" size={16} />
                    </button>
                  </div>
                </div>
                <dl>
                  <div>
                    <dt>Jami kirim ({products.length})</dt>
                    <dd>{money(sums.total)}</dd>
                  </div>
                  <div>
                    <dt>To‘langan</dt>
                    <dd className="green">{money(sums.paid)}</dd>
                  </div>
                  <div>
                    <dt>Qolgan qarz</dt>
                    <dd className="debt-text">{money(sums.debt)}</dd>
                  </div>
                </dl>
                {s.note && <p className="supplier-note">{s.note}</p>}
                <div className="supplier-actions">
                  <button
                    className="text-button"
                    onClick={() => setSelected(selected === s.id ? "" : s.id)}
                  >
                    {selected === s.id ? "Yopish" : "Kirimlarni ko‘rish"}
                    <Icon name="arrow" size={16} />
                  </button>
                  <button
                    className="button secondary small"
                    disabled={sums.debt <= 0}
                    onClick={() => openForm("payment", null, s.id)}
                  >
                    To‘lov
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {supplier && (
        <section className="supplier-detail">
          <div className="section-heading">
            <h2>{supplier.name} — mahsulot kirimlari</h2>
            <button
              className="text-button"
              onClick={() => openForm("product", null, supplier.id)}
            >
              Yangi kirim <Icon name="plus" size={17} />
            </button>
          </div>
          <ProductTable
            products={data.products.filter((p) => p.supplierId === supplier.id)}
          />
        </section>
      )}
    </>
  );
}
```
