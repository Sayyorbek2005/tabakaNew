import { useStore } from "../context/StoreContext";
import { number } from "../utils/accounting";
import { usagesReport } from "../utils/reports";
import PdfButton from "./PdfButton";

export default function UsageHistory({ products }) {
  const { data } = useStore();
  const ids = products.map((product) => product.id);

  const usages = (data.usages || [])
    .filter((usage) => ids.includes(usage.productId))
    .slice()
    .reverse();

  return (
    <section className="usage-history">
      <div className="section-heading">
        <h2>Sarf va qoldiq tarixi</h2>
        <PdfButton report={usagesReport(data, products, usages)} />
      </div>

      {!usages.length ? (
        <p className="form-hint">Hali sarf yozuvi yo‘q.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID / sana</th>
                <th>Mahsulot</th>
                <th>Oldin</th>
                <th>Ishlatildi</th>
                <th>Keyin</th>
                <th>Izoh</th>
              </tr>
            </thead>

            <tbody>
              {usages.map((usage) => {
                const product = data.products.find(
                  (item) => item.id === usage.productId
                );

                return (
                  <tr key={usage.id}>
                    <td>
                      {usage.code}
                      <small className="code">{usage.date}</small>
                    </td>

                    <td>
                      {product?.name}
                      <small className="code">{product?.code}</small>
                    </td>

                    <td>{number(usage.before)} {usage.unit}</td>
                    <td>{number(usage.quantity)} {usage.unit}</td>
                    <td className="green">
                      {number(usage.after)} {usage.unit}
                    </td>

                    <td>{usage.note || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}