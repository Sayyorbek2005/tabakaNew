import Modal from "./Modal";
import { useState } from "react";
import PdfButton from "./PdfButton";
import AdditionalPaymentFields from "./AdditionalPaymentFields";
import { additionalPaymentTotals } from "../utils/additionalPayments";
import { additionalUsed, additionalRemaining } from "../utils/additionalInventory";
import "./DetailsModal.css";
import "./AdditionalProductDetails.css";

const money = (value) => `${Number(value || 0).toLocaleString("uz-UZ")} so‘m`;
const number = (value) => Number(value || 0).toLocaleString("uz-UZ");
const date = (value) => value ? value.split("-").reverse().join(".") : "—";

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

export default function AdditionalProductDetails({ product, onClose, onAddUsage, onAddPayment }) {
  const [using, setUsing] = useState(false);
  const [input, setInput] = useState({ quantity: "", date: today(), note: "" });
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [payment, setPayment] = useState({ cash: "0", card: "0", paymentNote: "", date: today() });
  const [paymentError, setPaymentError] = useState("");
  const paymentTotals = additionalPaymentTotals(product);
  const payments = (product.payments || []).slice().reverse();
  const quantity = Number(product.quantity) || 0;
  const used = additionalUsed(product);
  const remaining = additionalRemaining(product);
  const usages = (product.usages || []).slice().reverse();
  const totalCost = quantity * (Number(product.cost) || 0);
  const totalPrice = quantity * (Number(product.price) || 0);
  const rows = [
    ["Ta’minotchi", product.supplierName || "—"],
    ["Kategoriya", product.category || "—"],
    ["Brend", product.brand || "—"],
    ["Kirim sanasi", date(product.date)],
    ["Kirim miqdori", `${number(quantity)} ${product.unit}`],
    ["Ishlatilgan", `${number(used)} ${product.unit}`],
    ["Qoldiq", `${number(remaining)} ${product.unit}`],
    ["Birlik sotuv narxi", money(product.price)],
    ["Birlik tan narxi", money(product.cost)],
    ["Izoh", product.note || "—"],
  ];
  const historySection = {
    title: "Sarf va qoldiq tarixi",
    headers: ["ID", "Sana", "Oldin", "Ishlatildi", "Keyin", "Izoh"],
    rows: usages.map((usage) => [usage.code, date(usage.date), `${number(usage.before)} ${usage.unit}`, `${number(usage.quantity)} ${usage.unit}`, `${number(usage.after)} ${usage.unit}`, usage.note || "—"]),
  };
  const historyReport = {
    title: `${product.name} — sarf va qoldiq tarixi`,
    meta: [`ID: ${product.code}`, `Kirim: ${number(quantity)} ${product.unit}`, `Ishlatilgan: ${number(used)} ${product.unit}`, `Qoldiq: ${number(remaining)} ${product.unit}`],
    sections: [historySection],
  };
  const report = {
    title: `${product.name} — qo‘shimcha mahsulot`,
    meta: [`ID: ${product.code}`, `Jami tan narxi: ${money(totalCost)}`, `Jami sotuv qiymati: ${money(totalPrice)}`, `To‘langan: ${money(paymentTotals.paid)}`, `Qolgan qarz: ${money(paymentTotals.debt)}`, `Ortiqcha to‘lov: ${money(paymentTotals.excess)}`, `Naqd: ${money(paymentTotals.cash)}`, `Karta: ${money(paymentTotals.card)}`],
    sections: [{ title: "Mahsulot ma’lumotlari", headers: ["Ma’lumot", "Qiymat"], rows }, {
      title: "To‘lov tarixi", headers: ["ID", "Sana", "Usul", "Summa", "Izoh"],
      rows: payments.map((item) => [item.code, date(item.date), item.method === "cash" ? "Naqd" : "Karta", money(item.amount), item.note || "—"]),
    }, historySection],
  };

  function submitUsage(event) {
    event.preventDefault();
    setError("");
    try {
      onAddUsage(input);
      setInput({ quantity: "", date: today(), note: "" });
      setUsing(false);
    } catch (error) {
      setError(error.message);
    }
  }

  function submitPayment(event) {
    event.preventDefault();
    setPaymentError("");
    try {
      onAddPayment({ ...payment, note: payment.paymentNote });
      setPayment({ cash: "0", card: "0", paymentNote: "", date: today() });
      setPaying(false);
    } catch (error) { setPaymentError(error.message); }
  }

  return (
    <Modal title="Mahsulot ma’lumotlari" onClose={onClose}>
      <div className="details">
        <PdfButton report={report} downloadable />
        <div className="details-title">
          <small>{product.code}</small>
          <h3>{product.name}</h3>
        </div>
        <dl className="details-info">
          {rows.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
        </dl>
        <div className="details-totals">
          <div><span>Jami tan narxi</span><strong>{money(totalCost)}</strong></div>
          <div><span>Jami sotuv qiymati</span><strong>{money(totalPrice)}</strong></div>
          <div><span>To‘langan</span><strong>{money(paymentTotals.paid)}</strong></div>
          <div><span>Qolgan qarz</span><strong>{money(paymentTotals.debt)}</strong></div>
          <div><span>Ortiqcha to‘lov</span><strong>{money(paymentTotals.excess)}</strong></div>
        </div>
        <div className="details-methods">
          <span>Naqd: <strong>{money(paymentTotals.cash)}</strong></span>
          <span>Karta: <strong>{money(paymentTotals.card)}</strong></span>
        </div>
        <section className="additional-usage-history" aria-label="To‘lov tarixi">
          <div className="additional-usage-heading">
            <h4>To‘lov tarixi ({payments.length})</h4>
            {onAddPayment && <button type="button" className="button secondary" onClick={() => { setPaymentError(""); setPaying(!paying); }}>To‘lov qo‘shish</button>}
          </div>
          {paying && (
            <form className="additional-payment-form" onSubmit={submitPayment}>
              <label className="field">To‘lov sanasi<input type="date" required value={payment.date} min={product.date || undefined} onChange={(event) => setPayment({ ...payment, date: event.target.value })} /></label>
              <AdditionalPaymentFields cash={payment.cash} card={payment.card} note={payment.paymentNote}
                onChange={(change) => setPayment({ ...payment, ...change })} total={paymentTotals.total} existingPaid={paymentTotals.paid} title="Qo‘shimcha to‘lov" />
              {paymentError && <p className="form-error" role="alert">{paymentError}</p>}
              <div className="form-actions">
                <button type="button" className="button secondary" onClick={() => setPaying(false)}>Bekor qilish</button>
                <button type="submit" className="button">To‘lovni saqlash</button>
              </div>
            </form>
          )}
          {!payments.length ? <p className="form-hint">Hali to‘lov yozuvi yo‘q.</p> : <div className="details-list">
            {payments.map((item) => <article className="details-payment" key={item.id}>
              <div className="details-product-head"><strong>{item.code} · {item.method === "cash" ? "Naqd" : "Karta"}</strong><strong>{money(item.amount)}</strong></div>
              <p>{date(item.date)}</p>
              {item.note && <p>{item.note}</p>}
            </article>)}
          </div>}
        </section>
        <section className="additional-usage-history" aria-label="Sarf va qoldiq tarixi">
          <div className="additional-usage-heading">
            <h4>Sarf va qoldiq tarixi</h4>
            <PdfButton report={historyReport} downloadable />
          </div>
          {onAddUsage && <button type="button" className="button secondary" disabled={remaining <= 0} onClick={() => { setError(""); setUsing(!using); }}>Sarf kiritish</button>}
          {using && (
            <form className="additional-usage-form" onSubmit={submitUsage}>
              <p className="form-hint">Mavjud qoldiq: {number(remaining)} {product.unit}</p>
              <div className="form-grid">
                <label className="field">Sarf miqdori ({product.unit})<input autoFocus type="number" inputMode={product.unit === "dona" ? "numeric" : "decimal"} required min={product.unit === "dona" ? "1" : "0.001"} max={remaining} step={product.unit === "dona" ? "1" : "0.001"} value={input.quantity} onChange={(event) => setInput({ ...input, quantity: event.target.value })} /></label>
                <label className="field">Sarf sanasi<input required type="date" min={product.date || undefined} value={input.date} onChange={(event) => setInput({ ...input, date: event.target.value })} /></label>
                <label className="field wide">Sarf izohi<textarea rows="2" value={input.note} onChange={(event) => setInput({ ...input, note: event.target.value.toLocaleUpperCase("uz-UZ") })} /></label>
              </div>
              {error && <p className="form-error" role="alert">{error}</p>}
              <div className="form-actions">
                <button type="button" className="button secondary" onClick={() => setUsing(false)}>Bekor qilish</button>
                <button type="submit" className="button">Sarfni saqlash</button>
              </div>
            </form>
          )}
          {!usages.length ? <p className="form-hint">Hali sarf yozuvi yo‘q.</p> : (
            <div className="details-list">
              {usages.map((usage) => (
                <article className="details-payment" key={usage.id}>
                  <div className="details-product-head"><strong>{usage.code}</strong><small>{date(usage.date)}</small></div>
                  <dl className="additional-usage-balances">
                    <div><dt>Oldin</dt><dd>{number(usage.before)} {usage.unit}</dd></div>
                    <div><dt>Ishlatildi</dt><dd>{number(usage.quantity)} {usage.unit}</dd></div>
                    <div><dt>Keyin</dt><dd>{number(usage.after)} {usage.unit}</dd></div>
                  </dl>
                  {usage.note && <p>{usage.note}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      <div className="form-actions">
        <button type="button" className="button secondary" onClick={onClose}>Yopish</button>
      </div>
    </Modal>
  );
}
