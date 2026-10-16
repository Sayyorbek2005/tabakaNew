import { useState } from "react";
import { useStore } from "../context/StoreContext";
import {
  money,
  number,
  totalOf,
  paidOf,
  debtOf,
  totals,
  round,
} from "../utils/accounting";
import { usedOf, remainingOf } from "../utils/inventory";
import {
  productsReport,
  supplierReport,
} from "../utils/reports";
import PdfButton from "./PdfButton";
import UsageHistory from "./UsageHistory";
import Modal from "./Modal";
import "./DetailsModal.css";

export default function DetailsModal({ type, id, onClose }) {
  const { data } = useStore();
  const [view, setView] = useState({ type, id });

  const isProduct = view.type === "product";

  const product = isProduct
    ? data.products.find((item) => item.id === view.id)
    : null;

  const supplier = data.suppliers.find(
    (item) => item.id === (isProduct ? product?.supplierId : view.id)
  );

  const products = isProduct
    ? product ? [product] : []
    : data.products.filter((item) => item.supplierId === view.id);

  const sums = totals(products, data.payments);

  const payments = data.payments
    .filter((payment) =>
      isProduct
        ? payment.allocations.some(
            (allocation) => allocation.productId === view.id
          )
        : payment.supplierId === view.id
    )
    .slice()
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        b.code.localeCompare(a.code)
    );

  const amount = (payment) =>
    isProduct
      ? round(
          payment.allocations
            .filter((allocation) => allocation.productId === view.id)
            .reduce((sum, allocation) => sum + allocation.amount, 0)
        )
      : payment.amount;

  const byMethod = (method) =>
    round(
      payments
        .filter((payment) => payment.method === method)
        .reduce((sum, payment) => sum + amount(payment), 0)
    );

  const category = data.categories.find(
    (item) => item.id === product?.categoryId
  );

  const info = (label, value) => (
    <div>
      <dt>{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );

  return (
    <Modal
      title={isProduct ? "Mahsulot ma’lumotlari" : "Ta’minotchi ma’lumotlari"}
      onClose={onClose}
    >
      <div className="details">
        <PdfButton
          report={
            isProduct
              ? productsReport(data, products, `${product?.name} — mahsulot hisobi`)
              : supplierReport(data, view.id)
          }
        />

        <div className="details-title">
          <small>{isProduct ? product?.code : supplier?.code}</small>
          <h3>{isProduct ? product?.name : supplier?.name}</h3>
        </div>

        <dl className="details-info">
          {isProduct ? (
            <>
              {info(
                "Ta’minotchi",
                supplier && (
                  <button
                    className="text-button"
                    onClick={() =>
                      setView({ type: "supplier", id: supplier.id })
                    }
                  >
                    {supplier.name}
                  </button>
                )
              )}

              {info("Kategoriya", category?.name)}
              {info("Kirim sanasi", product?.date)}

              {info(
                "Kirim miqdori",
                product && `${number(product.quantity)} ${product.unit}`
              )}

              {info(
                "Ishlatilgan",
                product && `${number(usedOf(product.id, data.usages))} ${product.unit}`
              )}

              {info(
                "Qoldiq",
                product && `${number(remainingOf(product, data.usages))} ${product.unit}`
              )}

              {info("Birlik narxi", money(product?.price))}
              {info("Izoh", product?.note)}
            </>
          ) : (
            <>
              {info("Telefon", supplier?.phone)}
              {info("Kirimlar soni", String(products.length))}
              {info("Izoh", supplier?.note)}
            </>
          )}
        </dl>

        <div className="details-totals">
          <div><span>Jami kirim</span><strong>{money(sums.total)}</strong></div>
          <div><span>To‘langan</span><strong>{money(sums.paid)}</strong></div>
          <div><span>Qolgan qarz</span><strong>{money(sums.debt)}</strong></div>
        </div>

        <div className="details-methods">
          <span>Naqd: <strong>{money(byMethod("cash"))}</strong></span>
          <span>Karta: <strong>{money(byMethod("card"))}</strong></span>
        </div>

        {!isProduct && (
          <section>
            <h4>Barcha mahsulot kirimlari</h4>

            <div className="details-list">
              {!products.length && (
                <p className="details-empty">Mahsulot kirimi yo‘q.</p>
              )}

              {products
                .slice()
                .sort(
                  (a, b) =>
                    b.date.localeCompare(a.date) ||
                    b.code.localeCompare(a.code)
                )
                .map((item) => (
                  <button
                    className="details-product"
                    key={item.id}
                    onClick={() => setView({ type: "product", id: item.id })}
                  >
                    <div className="details-product-head">
                      <strong>{item.name}</strong>
                      <small>{item.code}</small>
                    </div>

                    <p>
                      {data.categories.find((category) => category.id === item.categoryId)?.name}
                      {" · "}{item.date}
                    </p>

                    <p>{number(item.quantity)} {item.unit} × {money(item.price)}</p>

                    <div className="details-product-sums">
                      <span>Jami: {money(totalOf(item))}</span>
                      <span>To‘langan: {money(paidOf(item.id, data.payments))}</span>
                      <span>Qarz: {money(debtOf(item, data.payments))}</span>
                    </div>
                  </button>
                ))}
            </div>
          </section>
        )}

        <section>
          <h4>To‘lov tarixi ({payments.length})</h4>

          <div className="details-list">
            {!payments.length && (
              <p className="details-empty">Hali to‘lov qilinmagan.</p>
            )}

            {payments.map((payment) => (
              <article className="details-payment" key={payment.id}>
                <div className="details-product-head">
                  <strong>
                    {payment.code} · {payment.method === "cash" ? "Naqd" : "Karta"}
                  </strong>
                  <strong>{money(amount(payment))}</strong>
                </div>

                <p>{payment.date}</p>

                {isProduct && (
                  <p>
                    Umumiy to‘lov: {money(payment.amount)}.
                    Yuqorida shu mahsulotga tegishli qismi ko‘rsatilgan.
                  </p>
                )}

                {!isProduct && (
                  <ul className="details-allocations">
                    {payment.allocations.map((allocation) => {
                      const item = data.products.find(
                        (product) => product.id === allocation.productId
                      );

                      return (
                        <li key={allocation.productId}>
                          <button
                            className="text-button"
                            onClick={() =>
                              setView({ type: "product", id: allocation.productId })
                            }
                          >
                            {item?.name} · {item?.code}
                          </button>

                          <span>{money(allocation.amount)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {payment.note && <p>Izoh: {payment.note}</p>}
              </article>
            ))}
          </div>
        </section>

        <UsageHistory products={products} />
      </div>
    </Modal>
  );
}