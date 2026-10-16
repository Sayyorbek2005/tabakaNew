import { useState } from "react";
import { useStore } from "../context/StoreContext";
import { money, totals } from "../utils/accounting";
import { productsReport } from "../utils/reports";
import Icon from "../components/Icon";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import SupplierEntryForm from "../components/SupplierEntryForm";
import DetailsModal from "../components/DetailsModal";
import PdfButton from "../components/PdfButton";
import LocalizedDateInput from "../components/LocalizedDateInput";
import { matchesSearch, matchesDateRange } from "../utils/filters";
import "./Suppliers.css";

export default function Suppliers({ openForm, confirmDelete }) {
  const { data } = useStore();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [registeredFrom, setRegisteredFrom] = useState("");
  const [registeredTo, setRegisteredTo] = useState("");
  const [filterReset, setFilterReset] = useState(0);
  const [adding, setAdding] = useState(null);
  const [detail, setDetail] = useState(null);
  const [receiptIds, setReceiptIds] = useState([]);

  const active = data.suppliers.filter(
    (supplier) => !supplier.deletedAt
  );

  const items = active.filter((supplier) => {
    const matchesQuery = matchesSearch(query, [supplier.name, supplier.phone, supplier.code, supplier.note]);
    if (!matchesQuery) return false;
    if (category && !data.products.some((product) =>
      product.supplierId === supplier.id && product.categoryId === category
    )) return false;
    if (!registeredFrom && !registeredTo) return true;

    const date = supplier.createdAt ? new Date(supplier.createdAt) : null;
    if (!date || Number.isNaN(date.getTime())) return false;
    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
    return matchesDateRange(dateKey, registeredFrom, registeredTo);
  });

  return (
    <>
      {adding && (
        <Modal
          title={
            adding === "existing"
              ? "Mavjud ta’minotchidan yangi kirim"
              : "Ta’minotchi va mahsulot kirimi"
          }
          onClose={() => setAdding(null)}
        >
          <SupplierEntryForm
            existing={adding === "existing"}
            onClose={() => setAdding(null)}
            onSaved={(id, ids) => {
              setReceiptIds(ids || []);
              setDetail(id);
            }}
          />
        </Modal>
      )}

      {detail && !adding && (
        <DetailsModal
          key={detail}
          type="supplier"
          id={detail}
          onClose={() => setDetail(null)}
        />
      )}

      <div className="page-heading">
        <div>
          <p className="eyebrow">HAMKORLAR</p>
          <h1>Ta’minotchilar</h1>
          <p>{active.length} ta ta’minotchi · har birining hisobi alohida.</p>
        </div>

        <div className="supplier-heading-actions">
          <button className="button" onClick={() => setAdding("new")}>
            <Icon name="plus" />
            Ta’minotchi qo‘shish
          </button>

          <button
            className="button secondary"
            disabled={!active.length}
            onClick={() => setAdding("existing")}
          >
            <Icon name="products" />
            Mahsulot qo‘shish
          </button>
        </div>
      </div>

      <div className="toolbar supplier-filters">
        <label className="search-box">
          <Icon name="search" />
          <input
            aria-label="Ta’minotchi qidirish"
            placeholder="Ism, ID yoki telefon bo‘yicha qidirish"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select
          className="supplier-category-filter"
          aria-label="Ta’minotchilarni kategoriya bo‘yicha izlash"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">Barcha kategoriyalar</option>
          {data.categories.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        <label className="supplier-date-filter">
          <span>Dan</span>
          <LocalizedDateInput
            aria-label="Ro‘yxatdan o‘tgan sana, dan"
            resetKey={filterReset}
            value={registeredFrom}
            onChange={(event) => {
              const next = event.target.value;
              if (next && registeredTo && next > registeredTo) setRegisteredTo("");
              setRegisteredFrom(next);
            }}
          />
        </label>
        <label className="supplier-date-filter">
          <span>Gacha</span>
          <LocalizedDateInput
            aria-label="Ro‘yxatdan o‘tgan sana, gacha"
            resetKey={filterReset}
            value={registeredTo}
            onChange={(event) => {
              const next = event.target.value;
              if (next && registeredFrom && next < registeredFrom) setRegisteredFrom("");
              setRegisteredTo(next);
            }}
          />
        </label>
        {(
          <button
            type="button"
            className="button secondary supplier-filter-reset"
            onClick={() => { setQuery(""); setRegisteredFrom(""); setRegisteredTo(""); setCategory(""); setFilterReset((version) => version + 1); }}
          >
            Filtrlarni tozalash
          </button>
        )}
      </div>

      {!!receiptIds.length && (
        <div className="receipt-panel">
          <span>Oxirgi qo‘shilgan kirim</span>

          <PdfButton
            report={productsReport(
              data,
              data.products.filter((product) =>
                receiptIds.includes(product.id)
              ),
              "Yangi kirim hisoboti"
            )}
          />
        </div>
      )}

      {!items.length ? (
        <EmptyState
          icon="suppliers"
          title="Ta’minotchilar topilmadi"
          text="Ta’minotchi va olib kelingan mahsulotlarni birga kiriting."
          action="Ta’minotchi qo‘shish"
          onAction={() => setAdding("new")}
        />
      ) : (
        <div className="supplier-grid">
          {items.map((supplier) => {
            const products = data.products.filter(
              (product) => product.supplierId === supplier.id
            );

            const sums = totals(products, data.payments);

            return (
              <article className="supplier-card" key={supplier.id}>
                <div className="supplier-top">
                  <span className="avatar">
                    {supplier.name.slice(0, 2).toUpperCase()}
                  </span>

                  <div>
                    <h2>
                      <button
                        className="detail-link"
                        onClick={() => setDetail(supplier.id)}
                      >
                        {supplier.name}
                      </button>
                    </h2>

                    <small>
                      {supplier.code} · {supplier.phone || "Telefon kiritilmagan"}
                    </small>
                  </div>

                  <div className="row-actions">
                    <button
                      className="icon-button"
                      aria-label={`${supplier.name}: tahrirlash`}
                      onClick={() => openForm("supplier", supplier)}
                    >
                      <Icon name="edit" size={16} />
                    </button>

                    <button
                      className="icon-button danger"
                      aria-label={`${supplier.name}: o‘chirish`}
                      onClick={() => confirmDelete("suppliers", supplier.id)}
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

                {supplier.note && (
                  <p className="supplier-note">{supplier.note}</p>
                )}

                <div className="supplier-actions">
                  <button
                    className="text-button"
                    onClick={() => setDetail(supplier.id)}
                  >
                    Batafsil ma’lumot <Icon name="arrow" size={16} />
                  </button>

                  <button
                    className="button secondary small"
                    disabled={sums.debt <= 0}
                    onClick={() => openForm("payment", null, supplier.id)}
                  >
                    To‘lov
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
