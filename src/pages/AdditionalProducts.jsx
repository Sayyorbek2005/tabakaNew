import { useMemo, useState } from "react";
import { useStore } from "../context/StoreContext";
import Icon from "../components/Icon";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import PdfButton from "../components/PdfButton";
import DateRangeFilter from "../components/DateRangeFilter";
import MoneyInput from "../components/MoneyInput";
import AdditionalProductDetails from "../components/AdditionalProductDetails";
import AdditionalPaymentFields from "../components/AdditionalPaymentFields";
import { additionalPaymentTotals, addAdditionalPayments } from "../utils/additionalPayments";
import "../components/DetailsModal.css";
import { additionalUsed, additionalRemaining, addAdditionalUsage } from "../utils/additionalInventory";
import { matchesSearch, matchesDateRange } from "../utils/filters";
import {
  readAdditionalProducts,
  saveAdditionalProducts,
} from "../services/additionalProductRepository";
import "./AdditionalProducts.css";

const localDate = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
};

const blankForm = () => ({
  name: "",
  brand: "",
  code: "",
  category: "",
  supplierName: "",
  unit: "dona",
  quantity: "",
  price: "",
  cost: "",
  date: localDate(),
  note: "",
  cash: "0",
  card: "0",
  paymentNote: "",
});

const money = (value) => `${Number(value || 0).toLocaleString("uz-UZ")} so‘m`;
const number = (value) => Number(value || 0).toLocaleString("uz-UZ");
const uppercase = (value) => String(value ?? "").toLocaleUpperCase("uz-UZ");
const uppercaseFields = (record) => ({
  ...record,
  ...Object.fromEntries(["name", "category", "supplierName", "brand", "code", "note"]
    .map((key) => [key, uppercase(record[key])])),
});

function loadRecords() {
  try {
    return { records: readAdditionalProducts(), error: "" };
  } catch (error) {
    return { records: [], error: error.message };
  }
}

export default function AdditionalProducts() {
  const { notify } = useStore();
  const initial = useMemo(loadRecords, []);
  const [products, setProducts] = useState(initial.records);
  const [storageError, setStorageError] = useState(initial.error);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [supplier, setSupplier] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterReset, setFilterReset] = useState(0);
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState("");
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [formError, setFormError] = useState("");

  const categories = [...new Set(products.map((item) => item.category).filter(Boolean))];
  const suppliers = [...new Set(products.map((item) => item.supplierName).filter(Boolean))];
  const items = products.filter((item) => {
    return matchesSearch(query, [item.code, item.name, item.brand, item.category, item.supplierName, item.note]) &&
      (!category || item.category === category) &&
      (!supplier || item.supplierName === supplier) &&
      matchesDateRange(item.date, dateFrom, dateTo);
  }).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalValue = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.cost) || 0), 0);

  function persist(next) {
    if (initial.error) {
      setStorageError("Oldingi saqlangan ma’lumotni o‘qib bo‘lmadi. Uni almashtirmaslik uchun avval sahifani qayta yuklang.");
      return false;
    }
    try {
      saveAdditionalProducts(next);
      setProducts(next);
      setStorageError("");
      return true;
    } catch {
      setStorageError("Qo‘shimcha mahsulot saqlanmadi. Brauzer xotirasini tekshiring.");
      return false;
    }
  }

  function openNew() {
    setEditingId("");
    setFormError("");
    setForm(blankForm());
  }

  function openEdit(product) {
    setEditingId(product.id);
    setFormError("");
    setForm(uppercaseFields({ ...blankForm(), ...product, cash: "0", card: "0", paymentNote: "" }));
  }

  function save(event) {
    event.preventDefault();
    setFormError("");
    const quantity = Number(form.quantity);
    const price = Number(form.price);
    const cost = Number(form.cost || 0);
    if (!form.name.trim() || !form.category.trim()) {
      setFormError("Mahsulot nomi va kategoriyasini kiriting.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(price) || price < 0 || !Number.isFinite(cost) || cost < 0) {
      setFormError("Miqdor va narxlarni to‘g‘ri kiriting.");
      return;
    }

    const current = products.find((item) => item.id === editingId);
    if (current && additionalUsed(current) > 0 && (quantity !== Number(current.quantity) || form.unit !== current.unit)) {
      setFormError("Sarf yozuvi bor mahsulotning kirim miqdori va birligi o‘zgartirilmaydi.");
      return;
    }
    if (current?.usages?.some((usage) => form.date && usage.date < form.date)) {
      setFormError("Kirim sanasi mavjud sarf sanasidan keyin bo‘lmasin.");
      return;
    }
    const { cash, card, paymentNote, ...productForm } = form;
    let record = {
      ...current,
      ...uppercaseFields(productForm),
      id: current?.id || (crypto.randomUUID?.() || `additional-${Date.now()}`),
      code: uppercase(form.code.trim() || current?.code || `QMH-${Date.now().toString().slice(-6)}`),
      name: uppercase(form.name.trim()),
      brand: uppercase(form.brand.trim()),
      category: uppercase(form.category.trim()),
      supplierName: uppercase(form.supplierName.trim()),
      quantity,
      price,
      cost,
      createdAt: current?.createdAt || new Date().toISOString(),
      usages: current?.usages || [],
      payments: current?.payments || [],
    };
    try {
      if (current?.payments?.some((payment) => form.date && payment.date < form.date)) throw new Error("Kirim sanasi mavjud to‘lov sanasidan keyin bo‘lmasin.");
      record = addAdditionalPayments(record, { cash, card, date: form.date, note: paymentNote });
    } catch (error) {
      setFormError(error.message);
      return;
    }
    const next = editingId
      ? products.map((item) => item.id === editingId ? record : item)
      : [record, ...products];

    if (!persist(next)) return;
    setForm(null);
    notify(editingId ? "Qo‘shimcha mahsulot yangilandi." : "Qo‘shimcha mahsulot qo‘shildi.");
  }

  function removeProduct() {
    if (!deleting) return;
    if (persist(products.filter((item) => item.id !== deleting.id))) {
      notify("Qo‘shimcha mahsulot o‘chirildi.");
      setDeleting(null);
    }
  }

  function saveUsage(productId, input) {
    const product = products.find((item) => item.id === productId);
    if (!product) throw new Error("Mahsulot topilmadi.");
    const updated = addAdditionalUsage(product, input);
    if (!persist(products.map((item) => item.id === productId ? updated : item))) {
      throw new Error("Sarf saqlanmadi. Brauzer xotirasini tekshiring.");
    }
    setViewing(updated);
    notify("Sarf va qoldiq tarixi saqlandi.");
  }

  function savePayment(productId, input) {
    const product = products.find((item) => item.id === productId);
    if (!product) throw new Error("Mahsulot topilmadi.");
    if (Number(input.cash || 0) + Number(input.card || 0) <= 0) throw new Error("To‘lov summasini kiriting.");
    const updated = addAdditionalPayments(product, input);
    if (!persist(products.map((item) => item.id === productId ? updated : item))) throw new Error("To‘lov saqlanmadi. Brauzer xotirasini tekshiring.");
    setViewing(updated);
    notify("Qo‘shimcha mahsulot to‘lovi saqlandi.");
  }

  function exportCsv() {
    const columns = ["ID", "Mahsulot", "Brend", "Kategoriya", "Ta’minotchi", "Miqdor", "Birlik", "Sotuv narxi", "Tan narxi", "Sana", "To‘langan", "Qarz", "Ortiqcha to‘lov"];
    const rows = items.map((item) => [item.code, item.name, item.brand, item.category, item.supplierName, item.quantity, item.unit, item.price, item.cost, item.date, additionalPaymentTotals(item).paid, additionalPaymentTotals(item).debt, additionalPaymentTotals(item).excess]);
    const csv = [columns, ...rows].map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "qoshimcha-mahsulotlar.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ALOHIDA RO‘YXAT</p>
          <h1>Qo‘shimcha mahsulotlar</h1>
          <p>{products.length} ta mahsulot · asosiy kirim va hisob-kitoblardan alohida.</p>
        </div>
        <div className="supplier-heading-actions">
          <button className="button secondary" onClick={exportCsv} disabled={!items.length}>
            <Icon name="download" /> CSV yuklab olish
          </button>
          <PdfButton downloadable report={{
            title: "Qo‘shimcha mahsulotlar",
            sections: [{
              title: "Mahsulotlar ro‘yxati",
              headers: ["ID", "Mahsulot", "Kategoriya", "Ta’minotchi", "Miqdor", "Sotuv narxi", "Tan narxi", "Sana", "To‘langan", "Qarz", "Ortiqcha to‘lov"],
              rows: items.map((item) => [item.code, item.name, item.category, item.supplierName || "—", `${number(item.quantity)} ${item.unit}`, money(item.price), money(item.cost), item.date || "—", money(additionalPaymentTotals(item).paid), money(additionalPaymentTotals(item).debt), money(additionalPaymentTotals(item).excess)]),
            }],
          }} />
          <button className="button" onClick={openNew}>
            <Icon name="plus" /> Qo‘shimcha mahsulot qo‘shish
          </button>
        </div>
      </div>

      {storageError && <p className="form-error" role="alert">{storageError}</p>}

      <div className="additional-product-stats">
        <article><span>Mahsulotlar</span><strong>{items.length}</strong></article>
        <article><span>Jami miqdor</span><strong>{number(totalQuantity)}</strong></article>
        <article><span>Tan narxi bo‘yicha qiymati</span><strong>{money(totalValue)}</strong></article>
      </div>

      <div className="toolbar product-filters additional-product-filters with-date-range">
        <label className="search-box">
          <Icon name="search" />
          <input
            aria-label="Qo‘shimcha mahsulot qidirish"
            placeholder="Mahsulot nomi, ID yoki kategoriya"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select aria-label="Qo‘shimcha mahsulot kategoriyasi" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">Barcha kategoriyalar</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select aria-label="Qo‘shimcha mahsulot ta’minotchisi" value={supplier} onChange={(event) => setSupplier(event.target.value)}>
          <option value="">Barcha ta’minotchilar</option>
          {suppliers.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <DateRangeFilter from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} resetKey={filterReset} />
      </div>
      <div className="filter-feedback">
        <span>{items.length} ta mahsulot topildi</span>
        <button type="button" className="text-button" onClick={() => {
          setQuery(""); setCategory(""); setSupplier(""); setDateFrom(""); setDateTo(""); setFilterReset((version) => version + 1);
        }}>Filtrlarni tozalash</button>
      </div>

      {!items.length ? (
        <EmptyState
          title={products.length ? "Mahsulotlar topilmadi" : "Qo‘shimcha mahsulotlar yo‘q"}
          text={products.length ? "Qidiruv yoki filtrlarni o‘zgartiring." : "Yangi mahsulot qo‘shing. Bu ro‘yxat boshqa bo‘limlardan alohida saqlanadi."}
          action={products.length ? undefined : "Mahsulot qo‘shish"}
          onAction={openNew}
        />
      ) : (
        <div className="additional-product-table-wrap">
          <table className="additional-product-table">
            <thead><tr><th>Mahsulot / ID</th><th>Ta’minotchi</th><th>Kategoriya</th><th>Miqdor</th><th>Sotuv narxi</th><th>Tan narxi</th><th>Sana</th><th>To‘langan</th><th>Qarz</th><th>Ortiqcha to‘lov</th><th>Amallar</th></tr></thead>
            <tbody>{items.map((item) => (
              <tr
                key={item.id}
                className="additional-product-row"
                tabIndex={0}
                aria-label={`${item.name}: batafsil`}
                onClick={(event) => {
                  if (!event.target.closest("button,a,input,select,textarea")) setViewing(item);
                }}
                onKeyDown={(event) => {
                  if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    setViewing(item);
                  }
                }}
              >
                <td><button className="detail-link" onClick={() => setViewing(item)}>{item.name}</button><small className="additional-product-code">{item.code}{item.brand ? ` · ${item.brand}` : ""}</small></td>
                <td>{item.supplierName || "—"}</td>
                <td><span className="pill">{item.category}</span></td>
                <td>{number(item.quantity)} {item.unit}{!!item.usages?.length && <small className="additional-product-code">Qoldiq: {number(additionalRemaining(item))} {item.unit}</small>}</td>
                <td>{money(item.price)}</td>
                <td>{money(item.cost)}</td>
                <td>{item.date || "—"}</td>
                <td>{money(additionalPaymentTotals(item).paid)}</td>
                <td>{money(additionalPaymentTotals(item).debt)}</td>
                <td>{money(additionalPaymentTotals(item).excess)}</td>
                <td><div className="row-actions">
                  <button className="icon-button" aria-label={`${item.name}: ko‘rish`} onClick={() => setViewing(item)}><Icon name="products" size={16} /></button>
                  <button className="icon-button" aria-label={`${item.name}: tahrirlash`} onClick={() => openEdit(item)}><Icon name="edit" size={16} /></button>
                  <button className="icon-button danger" aria-label={`${item.name}: o‘chirish`} onClick={() => setDeleting(item)}><Icon name="delete" size={16} /></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
          <div className="table-footer"><span>{items.length} ta mahsulot</span><span>Jami ortiqcha to‘lov <strong>{money(items.reduce((sum, item) => sum + additionalPaymentTotals(item).excess, 0))}</strong></span><span>Jami tan narxi <strong>{money(items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.cost) || 0), 0))}</strong></span></div>
        </div>
      )}

      {form && (
        <Modal title={editingId ? "Qo‘shimcha mahsulotni tahrirlash" : "Qo‘shimcha mahsulot qo‘shish"} onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <div className="form-grid">
              <label className="field wide">Mahsulot nomi<input autoFocus required autoCapitalize="characters" value={form.name} onChange={(event) => setForm({ ...form, name: uppercase(event.target.value) })} /></label>
              <label className="field">Kategoriya<input required autoCapitalize="characters" value={form.category} onChange={(event) => setForm({ ...form, category: uppercase(event.target.value) })} /></label>
              <label className="field">Ta’minotchi nomi<input autoCapitalize="characters" value={form.supplierName} onChange={(event) => setForm({ ...form, supplierName: uppercase(event.target.value) })} /></label>
              <label className="field">Brend<input autoCapitalize="characters" value={form.brand} onChange={(event) => setForm({ ...form, brand: uppercase(event.target.value) })} /></label>
              <label className="field">ID / Kod<input autoCapitalize="characters" value={form.code} onChange={(event) => setForm({ ...form, code: uppercase(event.target.value) })} placeholder="Avtomatik yaratiladi" /></label>
              <label className="field">Miqdor<input type="number" min="0" step="any" required value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></label>
              <label className="field">Birlik<select value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })}><option value="dona">Dona</option><option value="kg">Kg</option><option value="litr">Litr</option></select></label>
              <label className="field">Sotuv narxi<MoneyInput required value={form.price} onValueChange={(price) => setForm({ ...form, price })} /></label>
              <label className="field">Tan narxi<MoneyInput value={form.cost} onValueChange={(cost) => setForm({ ...form, cost })} /></label>
              <label className="field">Sana<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
              <label className="field wide">Izoh<textarea rows="3" autoCapitalize="characters" value={form.note} onChange={(event) => setForm({ ...form, note: uppercase(event.target.value) })} /></label>
            </div>
            <AdditionalPaymentFields cash={form.cash} card={form.card} note={form.paymentNote}
              onChange={(change) => setForm({ ...form, ...change })}
              total={additionalPaymentTotals(form).total}
              existingPaid={editingId ? additionalPaymentTotals(products.find((item) => item.id === editingId) || {}).paid : 0}
              title={editingId ? "Qo‘shimcha to‘lov" : "Yangi kirim uchun to‘lov"} />
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <div className="form-actions">
              <button type="button" className="button secondary" onClick={() => setForm(null)}>Bekor qilish</button>
              <button type="submit" className="button">Saqlash</button>
            </div>
          </form>
        </Modal>
      )}

      {viewing && (
        <AdditionalProductDetails product={viewing} onClose={() => setViewing(null)} onAddUsage={(input) => saveUsage(viewing.id, input)} onAddPayment={(input) => savePayment(viewing.id, input)} />
      )}

      {deleting && (
        <Modal title="Qo‘shimcha mahsulotni o‘chirasizmi?" onClose={() => setDeleting(null)}>
          <p className="confirm-text"><strong>{deleting.name}</strong> faqat qo‘shimcha mahsulotlar ro‘yxatidan o‘chiriladi.</p>
          <div className="form-actions">
            <button type="button" className="button secondary" onClick={() => setDeleting(null)}>Bekor qilish</button>
            <button type="button" className="button destructive" onClick={removeProduct}>O‘chirish</button>
          </div>
        </Modal>
      )}
    </>
  );
}
