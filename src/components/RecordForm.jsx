import { useState } from "react";
import { useStore } from "../context/StoreContext";
import AdditionalPaymentFields from "./AdditionalPaymentFields";
import {
  debtOf,
  money,
  today,
  totalOf,
} from "../utils/accounting";

export default function RecordForm({
  type,
  record,
  onClose,
  supplierId = "",
}) {
  const {
    data,
    saveSupplier,
    saveCategory,
    saveProduct,
    addPayment,
  } = useStore();

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
    cash: "0",
    card: "0",
    paymentNote: "",
    ...record,
  });

  const [error, setError] = useState("");

  function change(key, value) {
    setValues((previous) => ({
      ...previous,
      [key]: value,
      ...(key === "supplierId" ? { productId: "" } : {}),
    }));
  }

  const field = (
    key,
    label,
    { wide = false, ...props } = {}
  ) => (
    <label className={`field ${wide ? "wide" : ""}`}>
      {label}
      <input
        value={values[key]}
        onChange={(event) => change(key, event.target.value)}
        {...props}
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
        onChange={(event) => change(key, event.target.value)}
      >
        {options.map(([value, name]) => (
          <option key={value} value={value}>{name}</option>
        ))}
      </select>
    </label>
  );

  const suppliers = [
    ["", "Ta’minotchini tanlang"],
    ...data.suppliers
      .filter(
        (supplier) =>
          !supplier.deletedAt ||
          supplier.id === record?.supplierId
      )
      .map((supplier) => [supplier.id, supplier.name]),
  ];

  const products = data.products.filter(
    (product) =>
      product.supplierId === values.supplierId &&
      debtOf(product, data.payments) > 0
  );

  const available = products
    .filter(
      (product) =>
        !values.productId || product.id === values.productId
    )
    .reduce(
      (sum, product) => sum + debtOf(product, data.payments),
      0
    );

  function submit(event) {
    event.preventDefault();
    setError("");

    try {
      if (type === "supplier") saveSupplier(values, record?.id);
      if (type === "category") saveCategory(values, record?.id);
      if (type === "product") saveProduct(values, record?.id);
      if (type === "payment") addPayment(values);

      onClose();
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="form-grid">
        {type !== "payment" &&
          field(
            "name",
            type === "product" ? "Mahsulot nomi" : "Nomi",
            {
              required: true,
              autoFocus: true,
              maxLength: 120,
              wide: true,
            }
          )}

        {type === "supplier" &&
          field("phone", "Telefon", {
            type: "tel",
            maxLength: 30,
            wide: true,
          })}

        {type === "product" && (
          <>
            {select("supplierId", "Ta’minotchi", suppliers)}

            {select("categoryId", "Kategoriya", [
              ["", "Kategoriyani tanlang"],
              ...data.categories.map((category) => [
                category.id,
                category.name,
              ]),
            ])}

            {select("unit", "Birlik", [
              ["kg", "Kilogramm (kg)"],
              ["litr", "Litr"],
              ["dona", "Dona"],
            ])}

            {field("quantity", "Miqdor", {
              required: true,
              type: "number",
              min: values.unit === "dona" ? "1" : "0.001",
              step: values.unit === "dona" ? "1" : "0.001",
            })}

            {field("price", "1 birlik narxi (so‘m)", {
              required: true,
              type: "number",
              min: "0.01",
              step: "0.01",
            })}

            {field("date", "Kirim sanasi", {
              required: true,
              type: "date",
            })}

            <div className="form-preview">
              <span>Kirim summasi</span>
              <strong>
                {money(
                  totalOf({
                    quantity: Number(values.quantity),
                    price: Number(values.price),
                  })
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
                ["", "Barcha qarzlar (eski kirimdan)"],
                ...products.map((product) => [
                  product.id,
                  `${product.code} · ${product.name}`,
                ]),
              ],
              false
            )}

            {field("amount", "To‘lov summasi (so‘m)", {
              required: true,
              type: "number",
              min: "0.01",
              max: available,
              step: "0.01",
            })}

            {select("method", "To‘lov usuli", [
              ["cash", "Naqd"],
              ["card", "Karta"],
            ])}

            {field("date", "To‘lov sanasi", {
              required: true,
              type: "date",
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
            Izoh
            <textarea
              rows={2}
              maxLength={500}
              value={values.note}
              onChange={(event) =>
                change("note", event.target.value)
              }
            />
          </label>
        )}
      </div>

      {type === "product" && !record?.id && (
        <AdditionalPaymentFields cash={values.cash} card={values.card} note={values.paymentNote}
          total={totalOf({ quantity: Number(values.quantity), price: Number(values.price) })}
          totalLabel="Kirim summasi" allowOverpayment={false}
          hint="To‘lov bo‘lmasa, 0 qoldiring. To‘lov faqat shu yangi kirimga yoziladi."
          onChange={(changes) => setValues((previous) => ({ ...previous, ...changes }))} />
      )}

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

        <button className="button" type="submit">
          Saqlash
        </button>
      </div>
    </form>
  );
}
