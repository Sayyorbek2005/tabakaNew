import { useStore } from "../context/StoreContext";
import { money, totals, number } from "../utils/accounting";
import StatCard from "../components/StatCard";
import ProductTable from "../components/ProductTable";
import Icon from "../components/Icon";
import "./Dashboard.css";

export default function Dashboard({ navigate, openForm }) {
  const { data } = useStore();
  const sums = totals(data.products, data.payments);

  const cash = data.payments
    .filter((payment) => payment.method === "cash")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const card = data.payments
    .filter((payment) => payment.method === "card")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const recent = [...data.products]
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        b.code.localeCompare(a.code)
    )
    .slice(0, 5);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">BARCHASI NAZORATDA</p>
          <h1>Umumiy ko‘rinish</h1>
          <p>Kirimlar, to‘lovlar va qarzlar — bitta joyda.</p>
        </div>

        <button className="button" onClick={() => openForm("product")}>
          <Icon name="plus" />
          Yangi kirim
        </button>
      </div>

      <div className="stats">
        <StatCard
          label="Jami kirim summasi"
          value={money(sums.total)}
          hint={`${data.products.length} ta mahsulot kirimi`}
          icon="products"
          tone="accent"
        />

        <StatCard
          label="Jami to‘langan"
          value={money(sums.paid)}
          hint={`${data.payments.length} ta to‘lov qayd qilingan`}
          icon="payments"
        />

        <StatCard
          label="Jami qarzimiz"
          value={money(sums.debt)}
          hint="Ta’minotchilarga qolgan qarz"
          icon="debt"
          tone="warning"
        />

        <StatCard
          label="Ta’minotchilar"
          value={number(
            data.suppliers.filter((supplier) => !supplier.deletedAt).length
          )}
          hint={`${data.categories.length} ta kategoriya`}
          icon="suppliers"
        />
      </div>

      <div className="overview-grid">
        <section className="panel payment-summary">
          <div className="section-heading">
            <h2>To‘lovlar taqsimoti</h2>
            <span className="pill">Barcha vaqt</span>
          </div>

          <div className="payment-split">
            <div>
              <span className="payment-label">
                <span className="dot cash" />Naqd
              </span>
              <strong>{money(cash)}</strong>
            </div>

            <div>
              <span className="payment-label">
                <span className="dot card" />Karta
              </span>
              <strong>{money(card)}</strong>
            </div>
          </div>

          <div className="split-bar" aria-label="Naqd va karta to‘lovlari nisbati">
            <span
              style={{
                width: `${sums.paid ? (cash / sums.paid) * 100 : 0}%`,
              }}
            />
          </div>

          <button className="text-button" onClick={() => navigate("payments")}>
            To‘lovlarni ko‘rish <Icon name="arrow" size={17} />
          </button>
        </section>

        <section className="quick-card">
          <span className="quick-icon">
            <Icon name="suppliers" size={27} />
          </span>

          <h2>Ishni tartibli boshlang.</h2>
          <p>
            Ta’minotchini qo‘shayotganda mahsulotlarini,
            kategoriyalarini va boshlang‘ich to‘lovini birga kiriting.
          </p>

          <button className="text-button" onClick={() => navigate("suppliers")}>
            Ta’minotchilar <Icon name="arrow" size={17} />
          </button>
        </section>
      </div>

      <div className="section-heading">
        <div>
          <h2>Oxirgi kirimlar</h2>
          <p>Eng yangi 5 ta mahsulot kirimi</p>
        </div>

        <button className="text-button" onClick={() => navigate("products")}>
          Barchasi <Icon name="arrow" size={17} />
        </button>
      </div>

      <ProductTable products={recent} />
    </>
  );
}