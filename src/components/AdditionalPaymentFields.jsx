import MoneyInput from "./MoneyInput";
import { round } from "../utils/accounting";
import "./AdditionalPaymentFields.css";

const money = (value) => `${Number(value || 0).toLocaleString("uz-UZ")} so‘m`;

export default function AdditionalPaymentFields({ cash, card, note, onChange, total, existingPaid = 0, allowOverpayment = true, title = "Yangi kirim uchun to‘lov", totalLabel = "Kirim summasi (tan narxi)", hint = "To‘lov bo‘lmasa, 0 qoldiring. To‘lov faqat shu qo‘shimcha mahsulotga yoziladi." }) {
  const payment = round(Number(cash || 0) + Number(card || 0));
  const debt = round(total - existingPaid - payment);
  return (
    <section className="additional-payment-fields" aria-label={title}>
      <h3>{title}</h3>
      <div className="form-grid">
        <label className="field">Naqd to‘lov (so‘m)<MoneyInput value={cash} onValueChange={(value) => onChange({ cash: value })} /></label>
        <label className="field">Karta to‘lovi (so‘m)<MoneyInput value={card} onValueChange={(value) => onChange({ card: value })} /></label>
        <label className="field wide">To‘lov izohi (ixtiyoriy)<textarea rows="2" value={note} onChange={(event) => onChange({ paymentNote: event.target.value.toLocaleUpperCase("uz-UZ") })} /></label>
      </div>
      <div className="details-totals">
        <div><span>{totalLabel}</span><strong>{money(total)}</strong></div>
        {existingPaid > 0 && <div><span>Oldin to‘langan</span><strong>{money(existingPaid)}</strong></div>}
        <div><span>Jami yangi to‘lov</span><strong>{money(payment)}</strong></div>
        <div><span>Qolgan qarz</span><strong>{money(Math.max(0, debt))}</strong></div>
        {allowOverpayment && <div><span>Ortiqcha to‘lov</span><strong>{money(Math.max(0, -debt))}</strong></div>}
      </div>
      {!allowOverpayment && debt < 0 && <p className="form-error" role="alert">To‘lovlar jami kirim summasidan oshmasin.</p>}
      <p className="form-hint">{hint}</p>
    </section>
  );
}
