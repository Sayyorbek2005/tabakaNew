import { useState } from "react";
import { useStore } from "../context/StoreContext";
import { number, today } from "../utils/accounting";
import { remainingOf, qty } from "../utils/inventory";

export default function UsageForm({ onClose }) {
  const { data, addUsage } = useStore();

  const [values, setValues] = useState({
    productId: "",
    quantity: "",
    date: today(),
    note: "",
  });

  const [error, setError] = useState("");

  const product = data.products.find(
    (item) => item.id === values.productId
  );

  const remaining = product
    ? remainingOf(product, data.usages)
    : 0;

  const change = (key, value) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  function submit(event) {
    event.preventDefault();
    setError("");

    try {
      addUsage(values);
      onClose();
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="form-grid">
        <label className="field wide">
          Mahsulotni tanlang
          <select
            required
            autoFocus
            aria-label="Mahsulotni tanlang"
            value={values.productId}
            onChange={(event) =>
              setValues((previous) => ({
                ...previous,
                productId: event.target.value,
                quantity: "",
              }))
            }
          >
            <option value="">Mahsulotni tanlang</option>

            {data.products
              .filter((item) => remainingOf(item, data.usages) > 0)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.code} ·{" "}
                  {number(remainingOf(item, data.usages))} {item.unit}
                </option>
              ))}
          </select>
        </label>

        <label className="field">
          Ishlatilgan miqdor {product ? `(${product.unit})` : ""}
          <input
            required
            type="number"
            min={product?.unit === "dona" ? "1" : "0.001"}
            max={remaining}
            step={product?.unit === "dona" ? "1" : "0.001"}
            value={values.quantity}
            onChange={(event) =>
              change("quantity", event.target.value)
            }
          />
        </label>

        <label className="field">
          Sarf sanasi
          <input
            required
            type="date"
            min={product?.date}
            value={values.date}
            onChange={(event) => change("date", event.target.value)}
          />
        </label>

        <label className="field wide">
          Izoh
          <textarea
            rows={2}
            maxLength={500}
            value={values.note}
            onChange={(event) => change("note", event.target.value)}
          />
        </label>

        <div className="form-preview">
          <span>
            Hozir: {number(remaining)} {product?.unit}
          </span>

          <strong>
            Keyin:{" "}
            {number(qty(remaining - Number(values.quantity || 0)))}{" "}
            {product?.unit}
          </strong>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">{error}</p>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="button secondary"
          onClick={onClose}
        >
          Bekor qilish
        </button>

        <button type="submit" className="button">
          Sarfni saqlash
        </button>
      </div>
    </form>
  );
}