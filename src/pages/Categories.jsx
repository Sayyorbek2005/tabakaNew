import { useState } from "react";
import { useStore } from "../context/StoreContext";
import { money, totals } from "../utils/accounting";
import { productsReport } from "../utils/reports";
import Icon from "../components/Icon";
import EmptyState from "../components/EmptyState";
import ProductTable from "../components/ProductTable";
import PdfButton from "../components/PdfButton";
import "./Categories.css";

export default function Categories({ openForm, confirmDelete }) {
  const { data } = useStore();
  const [selected, setSelected] = useState("");

  const category = data.categories.find(
    (item) => item.id === selected
  );

  const items = data.products.filter(
    (product) => product.categoryId === selected
  );

  if (category) {
    return (
      <>
        <div className="page-heading">
          <div>
            <button className="text-button" onClick={() => setSelected("")}>
              ← Kategoriyalarga qaytish
            </button>

            <h1>{category.name}</h1>
            <p>{category.code} · {items.length} ta kirim</p>
          </div>

          <PdfButton
            report={productsReport(
              data,
              items,
              `${category.name} — kategoriya hisobi`
            )}
          />
        </div>

        <ProductTable
          products={items}
          onEdit={(product) => openForm("product", product)}
          onDelete={(id) => confirmDelete("products", id)}
          onPay={(product) =>
            openForm("payment", {
              supplierId: product.supplierId,
              productId: product.id,
            })
          }
        />
      </>
    );
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">TARTIB VA GURUHLASH</p>
          <h1>Kategoriyalar</h1>
          <p>Kategoriyani bosib uning mahsulotlarini oching.</p>
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
          text="Mahsulotlarni kategoriyalarga ajrating."
          action="Kategoriya qo‘shish"
          onAction={() => openForm("category")}
        />
      ) : (
        <div className="category-grid">
          {data.categories.map((item) => {
            const products = data.products.filter(
              (product) => product.categoryId === item.id
            );

            const sums = totals(products, data.payments);

            return (
              <article
                className="category-card clickable-row"
                key={item.id}
                onClick={(event) => {
                  if (!event.target.closest("button")) {
                    setSelected(item.id);
                  }
                }}
              >
                <div className="category-top">
                  <span className="category-icon">
                    <Icon name="categories" size={24} />
                  </span>

                  <div className="row-actions">
                    <button
                      className="icon-button"
                      aria-label={`${item.name}: tahrirlash`}
                      onClick={() => openForm("category", item)}
                    >
                      <Icon name="edit" size={17} />
                    </button>

                    <button
                      className="icon-button danger"
                      aria-label={`${item.name}: o‘chirish`}
                      onClick={() => confirmDelete("categories", item.id)}
                    >
                      <Icon name="delete" size={17} />
                    </button>
                  </div>
                </div>

                <small className="code">{item.code}</small>

                <h2>
                  <button
                    className="detail-link"
                    onClick={() => setSelected(item.id)}
                  >
                    {item.name}
                  </button>
                </h2>

                <p>{products.length} ta mahsulot kirimi</p>

                <div className="category-total">
                  Jami summa
                  <strong>{money(sums.total)}</strong>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}