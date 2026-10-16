import { useState } from "react";
import { useStore } from "../context/StoreContext";
import { money } from "../utils/accounting";
import { paymentsReport } from "../utils/reports";
import Icon from "../components/Icon";
import EmptyState from "../components/EmptyState";
import StatCard from "../components/StatCard";
import PdfButton from "../components/PdfButton";
import "./Payments.css";

export default function Payments({ openForm, confirmDelete }) {
  const { data } = useStore();

  const [method, setMethod] = useState("");
  const [supplier, setSupplier] = useState("");

  const items = data.payments
    .filter(
      (payment) =>
        (!method || payment.method === method) &&
        (!supplier || payment.supplierId === supplier)
    )
    .slice()
    .reverse();

  const sum = (filter) =>
    items.filter(filter).reduce(
      (total, payment) => total + payment.amount,
      0
    );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">TO‘LOV TARIXI</p>
          <h1>To‘lovlar</h1>
          <p>Ta’minotchilarga amalga oshirilgan to‘lovlarni qayd qiling.</p>
        </div>

        <div className="supplier-heading-actions">
          <PdfButton report={paymentsReport(data, items)} />

          <button className="button" onClick={() => openForm("payment")}>
            <Icon name="plus" />
            To‘lov qo‘shish
          </button>
        </div>
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
          value={money(sum((payment) => payment.method === "cash"))}
          hint="Joriy filtr bo‘yicha"
          icon="payments"
        />

        <StatCard
          label="Karta to‘lovlari"
          value={money(sum((payment) => payment.method === "card"))}
          hint="Joriy filtr bo‘yicha"
          icon="payments"
        />
      </div>

      <div className="toolbar">
        <select
          aria-label="To‘lov usuli filtri"
          value={method}
          onChange={(event) => setMethod(event.target.value)}
        >
          <option value="">Barcha to‘lov usullari</option>
          <option value="cash">Naqd</option>
          <option value="card">Karta</option>
        </select>

        <select
          aria-label="Ta’minotchi filtri"
          value={supplier}
          onChange={(event) => setSupplier(event.target.value)}
        >
          <option value="">Barcha ta’minotchilar</option>

          {data.suppliers.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}{item.deletedAt ? " (arxiv)" : ""}
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
              {items.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <strong>{payment.code}</strong>
                    <small className="code">{payment.date}</small>
                  </td>

                  <td>
                    {
                      data.suppliers.find(
                        (supplier) => supplier.id === payment.supplierId
                      )?.name
                    }
                  </td>

                  <td>
                    <span className={`method-pill ${payment.method}`}>
                      {payment.method === "cash" ? "Naqd" : "Karta"}
                    </span>
                  </td>

                  <td className="green nowrap">
                    <strong>{money(payment.amount)}</strong>
                  </td>

                  <td>
                    {payment.allocations.map((allocation) => (
                      <small
                        className="allocation"
                        key={allocation.productId}
                      >
                        {
                          data.products.find(
                            (product) => product.id === allocation.productId
                          )?.code
                        }
                        {" · "}{money(allocation.amount)}
                      </small>
                    ))}
                  </td>

                  <td className="payment-note">
                    {payment.note || "—"}
                  </td>

                  <td>
                    <button
                      className="icon-button danger"
                      aria-label={`${payment.code}: bekor qilish`}
                      title="To‘lovni bekor qilish"
                      onClick={() => confirmDelete("payments", payment.id)}
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