import { useState } from "react";
import { useStore } from "../context/StoreContext";
import {
  debtOf,
  money,
  number,
  paidOf,
  totalOf,
} from "../utils/accounting";
import {
  usedOf,
  remainingOf,
} from "../utils/inventory";
import Icon from "./Icon";
import EmptyState from "./EmptyState";
import DetailsModal from "./DetailsModal";
import "./ProductTable.css";

export default function ProductTable({
  products,
  onEdit,
  onDelete,
  onPay,
}) {
  const { data } = useStore();
  const [detail, setDetail] = useState(null);

  const openProduct = (product) =>
    setDetail({ type: "product", id: product.id });

  if (!products.length) {
    return (
      <EmptyState
        title="Kirimlar topilmadi"
        text="Yangi mahsulot qo‘shing yoki filtrlarni o‘zgartiring."
      />
    );
  }

  return (
    <>
      {detail && (
        <DetailsModal
          key={`${detail.type}-${detail.id}`}
          {...detail}
          onClose={() => setDetail(null)}
        />
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mahsulot / ID</th>
              <th>Ta’minotchi</th>
              <th>Kategoriya</th>
              <th>Kirim</th>
              <th>Ishlatildi</th>
              <th>Qoldiq</th>
              <th>Birlik narxi</th>
              <th>Jami</th>
              <th>To‘langan</th>
              <th>Qarz</th>
              <th>Sana</th>
              {onEdit && <th>Amallar</th>}
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className="clickable-row"
                tabIndex={0}
                aria-label={`${product.name}: batafsil`}
                onClick={(event) => {
                  if (!event.target.closest("button,a,input")) {
                    openProduct(product);
                  }
                }}
                onKeyDown={(event) => {
                  if (
                    event.target === event.currentTarget &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    openProduct(product);
                  }
                }}
              >
                <td>
                  <button
                    className="detail-link"
                    onClick={() => openProduct(product)}
                  >
                    {product.name}
                  </button>
                  <small className="code">{product.code}</small>
                </td>

                <td>
                  <button
                    className="detail-link"
                    onClick={() =>
                      setDetail({
                        type: "supplier",
                        id: product.supplierId,
                      })
                    }
                  >
                    {
                      data.suppliers.find(
                        (supplier) => supplier.id === product.supplierId
                      )?.name
                    }
                  </button>
                </td>

                <td>
                  <span className="pill">
                    {
                      data.categories.find(
                        (category) => category.id === product.categoryId
                      )?.name
                    }
                  </span>
                </td>

                <td className="nowrap">
                  {number(product.quantity)} {product.unit}
                </td>

                <td className="nowrap">
                  {number(usedOf(product.id, data.usages))} {product.unit}
                </td>

                <td className="green nowrap">
                  {number(remainingOf(product, data.usages))} {product.unit}
                </td>

                <td className="nowrap">{money(product.price)}</td>

                <td className="nowrap">
                  <strong>{money(totalOf(product))}</strong>
                </td>

                <td className="green nowrap">
                  {money(paidOf(product.id, data.payments))}
                </td>

                <td className="debt-text nowrap">
                  {money(debtOf(product, data.payments))}
                </td>

                <td className="nowrap">{product.date}</td>

                {onEdit && (
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-button"
                        aria-label={`${product.name}: tahrirlash`}
                        onClick={() => onEdit(product)}
                      >
                        <Icon name="edit" size={17} />
                      </button>

                      {debtOf(product, data.payments) > 0 && onPay && (
                        <button
                          className="icon-button"
                          aria-label={`${product.name}: to‘lov`}
                          onClick={() => onPay(product)}
                        >
                          <Icon name="payments" size={17} />
                        </button>
                      )}

                      {onDelete && (
                        <button
                          className="icon-button danger"
                          aria-label={`${product.name}: o‘chirish`}
                          onClick={() => onDelete(product.id)}
                        >
                          <Icon name="delete" size={17} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}