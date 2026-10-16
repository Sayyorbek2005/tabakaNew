import { useState } from "react";
import { useStore } from "../context/StoreContext";
import {
  money,
  today,
  totalOf,
  round,
} from "../utils/accounting";
import Icon from "./Icon";
import "./SupplierEntryForm.css";

const newRow = () => ({
  key: crypto.randomUUID(),
  name: "",
  categoryId: "",
  categoryName: "",
  unit: "kg",
  quantity: "",
  price: "",
  note: "",
});

function Input({ label, wide = false, ...props }) {
  return (
    <label className={`field ${wide ? "entry-wide" : ""}`}>
      {label}
      <input {...props} />
    </label>
  );
}

export default function SupplierEntryForm({
  onClose,
  onSaved,
  existing = false,
}) {
  const { data, createSupplierEntry } = useStore();

  const [supplier, setSupplier] = useState({
    name: "",
    phone: "",
    supplierId: "",
    date: today(),
    note: "",
  });

  const [items, setItems] = useState(() => [newRow()]);
  const [cash, setCash] = useState("0");
  const [card, setCard] = useState("0");
  const [error, setError] = useState("");

  const changeSupplier = (key, value) =>
    setSupplier((previous) => ({
      ...previous,
      [key]: value,
    }));

  const changeRow = (key, field, value) =>
    setItems((rows) =>
      rows.map((row) =>
        row.key === key ? { ...row, [field]: value } : row
      )
    );

  const total = round(
    items.reduce(
      (sum, row) =>
        sum +
        totalOf({
          quantity: Number(row.quantity),
          price: Number(row.price),
        }),
      0
    )
  );

  const paid = round(Number(cash || 0) + Number(card || 0));
  const debt = round(total - paid);

  const selected = data.suppliers.find(
    (item) => item.id === supplier.supplierId
  );

  const inputSupplier = (key, label, props = {}) => (
    <Input
      label={label}
      value={supplier[key]}
      onChange={(event) =>
        changeSupplier(key, event.target.value)
      }
      {...props}
    />
  );

  function submit(event) {
    event.preventDefault();
    setError("");

    try {
      if (existing && !supplier.supplierId) {
        throw new Error("Ta’minotchini tanlang.");
      }

      const saved = createSupplierEntry({
        ...supplier,
        supplierId: existing ? supplier.supplierId : "",
        items,
        cash,
        card,
      });

      onSaved?.(saved.id, saved.productIds);
      onClose();
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <form className="supplier-entry" onSubmit={submit}>
      <div className="entry-fields">
        {existing ? (
          <>
            <label className="field entry-wide">
              Ta’minotchini tanlang
              <select
                required
                autoFocus
                aria-label="Ta’minotchini tanlang"
                value={supplier.supplierId}
                onChange={(event) =>
                  changeSupplier("supplierId", event.target.value)
                }
              >
                <option value="">Ta’minotchini tanlang</option>

                {data.suppliers
                  .filter((item) => !item.deletedAt)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {item.code}
                    </option>
                  ))}
              </select>
            </label>

            {selected && (
              <p className="entry-wide form-hint">
                {selected.code} ·{" "}
                {selected.phone || "Telefon kiritilmagan"}
              </p>
            )}
          </>
        ) : (
          <>
            {inputSupplier("name", "Ta’minotchi nomi", {
              required: true,
              autoFocus: true,
              maxLength: 120,
            })}

            {inputSupplier("phone", "Telefon", {
              type: "tel",
              maxLength: 30,
              placeholder: "+998 90 123 45 67",
            })}
          </>
        )}

        {inputSupplier("date", "Kirim sanasi", {
          type: "date",
          required: true,
          wide: true,
        })}
      </div>

      <div className="entry-section-title">
        <h3>Olib kelingan mahsulotlar</h3>
        <span>{items.length} ta</span>
      </div>

      <div className="entry-products">
        {items.map((row, index) => {
          const field = (key, label, props = {}) => (
            <Input
              label={label}
              value={row[key]}
              onChange={(event) =>
                changeRow(row.key, key, event.target.value)
              }
              {...props}
            />
          );

          return (
            <section
              className="entry-product"
              key={row.key}
              aria-label={`${index + 1}-mahsulot`}
            >
              <div className="entry-row-title">
                <strong>{index + 1}-mahsulot</strong>

                <button
                  type="button"
                  className="icon-button danger"
                  disabled={items.length === 1}
                  aria-label={`${index + 1}-mahsulotni olib tashlash`}
                  onClick={() =>
                    setItems((rows) =>
                      rows.filter((item) => item.key !== row.key)
                    )
                  }
                >
                  <Icon name="delete" size={17} />
                </button>
              </div>

              <div className="entry-fields">
                {field("name", "Mahsulot nomi", {
                  required: true,
                  maxLength: 120,
                  wide: true,
                })}

                <label className="field entry-wide">
                  Kategoriya
                  <select
                    required
                    aria-label="Kategoriya"
                    value={row.categoryId}
                    onChange={(event) =>
                      changeRow(
                        row.key,
                        "categoryId",
                        event.target.value
                      )
                    }
                  >
                    <option value="">Kategoriyani tanlang</option>

                    {data.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}

                    <option value="new">
                      + Yangi kategoriya yaratish
                    </option>
                  </select>
                </label>

                {row.categoryId === "new" &&
                  field("categoryName", "Yangi kategoriya nomi", {
                    required: true,
                    maxLength: 120,
                    wide: true,
                  })}

                <label className="field">
                  Birlik
                  <select
                    aria-label="Birlik"
                    value={row.unit}
                    onChange={(event) =>
                      changeRow(row.key, "unit", event.target.value)
                    }
                  >
                    <option value="kg">Kilogramm (kg)</option>
                    <option value="litr">Litr</option>
                    <option value="dona">Dona</option>
                  </select>
                </label>

                {field(
                  "quantity",
                  row.unit === "kg"
                    ? "Vazni (kg)"
                    : row.unit === "litr"
                      ? "Hajmi (litr)"
                      : "Miqdori (dona)",
                  {
                    required: true,
                    type: "number",
                    min: row.unit === "dona" ? "1" : "0.001",
                    step: row.unit === "dona" ? "1" : "0.001",
                  }
                )}

                {field("price", `1 ${row.unit} narxi (so‘m)`, {
                  required: true,
                  type: "number",
                  min: "0.01",
                  step: "0.01",
                  wide: true,
                })}

                {field("note", "Mahsulot izohi (ixtiyoriy)", {
                  maxLength: 500,
                  wide: true,
                })}
              </div>

              <div className="entry-line-total">
                <span>Shu mahsulot summasi</span>

                <strong>
                  {money(
                    totalOf({
                      quantity: Number(row.quantity),
                      price: Number(row.price),
                    })
                  )}
                </strong>
              </div>
            </section>
          );
        })}
      </div>

      <button
        type="button"
        className="button secondary entry-add"
        onClick={() => setItems((rows) => [...rows, newRow()])}
      >
        <Icon name="plus" size={18} />
        Yana mahsulot qo‘shish
      </button>

      <div className="entry-section-title">
        <h3>Yangi kirim uchun to‘lov</h3>
      </div>

      <div className="entry-fields">
        <Input
          label="Naqd to‘lov (so‘m)"
          required
          type="number"
          min="0"
          step="0.01"
          value={cash}
          onChange={(event) => setCash(event.target.value)}
        />

        <Input
          label="Karta to‘lovi (so‘m)"
          required
          type="number"
          min="0"
          step="0.01"
          value={card}
          onChange={(event) => setCard(event.target.value)}
        />

        <label className="field entry-wide">
          Kirim izohi (ixtiyoriy)
          <textarea
            rows={2}
            maxLength={500}
            value={supplier.note}
            onChange={(event) =>
              changeSupplier("note", event.target.value)
            }
          />
        </label>
      </div>

      <div className="entry-summary">
        <div>
          <span>Yangi kirim summasi</span>
          <strong>{money(total)}</strong>
        </div>

        <div>
          <span>Jami to‘lov</span>
          <strong>{money(paid)}</strong>
        </div>

        <div className={debt < 0 ? "entry-overpaid" : ""}>
          <span>Shu kirimdan qolgan qarz</span>
          <strong>{money(debt)}</strong>
        </div>
      </div>

      <p className="form-hint">
        To‘lov bo‘lmasa, 0 qoldiring. Bu to‘lov faqat yangi
        qo‘shilayotgan mahsulotlarga yoziladi. Oldingi qarzlar
        ta’minotchi ma’lumotida ko‘rinadi.
      </p>

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

        <button
          type="submit"
          className="button"
          disabled={debt < 0}
        >
          Barchasini saqlash
        </button>
      </div>
    </form>
  );
}