import { useState } from "react";
import { useStore } from "../context/StoreContext";
import Modal from "./Modal";
import Icon from "./Icon";
import StorageStatus from "./StorageStatus";
import BackupManager from "./BackupManager";
import "./Layout.css";

export const navigation = [
  {
    id: "dashboard",
    label: "Umumiy ko‘rinish",
    icon: "dashboard",
  },
  {
    id: "suppliers",
    label: "Ta’minotchilar",
    icon: "suppliers",
  },
  {
    id: "products",
    label: "Mahsulotlar",
    icon: "products",
  },
  {
    id: "categories",
    label: "Kategoriyalar",
    icon: "categories",
  },
  {
    id: "payments",
    label: "To‘lovlar",
    icon: "payments",
  },
  {
    id: "additional-products",
    label: "Qo‘shimcha mahsulotlar",
    icon: "products",
  },
];

export default function Layout({
  page,
  navigate,
  children,
}) {
  const { clearData } = useStore();

  const [confirmClear, setConfirmClear] = useState(false);
  const [clearError, setClearError] = useState("");
  const [backupsOpen, setBackupsOpen] = useState(false);

  function openClearModal() {
    setClearError("");
    setConfirmClear(true);
  }

  function handleClear() {
    setClearError("");

    try {
      clearData();
      setConfirmClear(false);
    } catch (error) {
      setClearError(error.message);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#dashboard"
          onClick={(event) => {
            event.preventDefault();
            navigate("dashboard");
          }}
        >
          <span className="brand-symbol">
            <Icon name="products" size={25} />
          </span>

          <span>
            ta’minot<span className="brand-dot">.</span>
            <small>HISOB NAZORATI</small>
          </span>
        </a>

        <div className="nav-caption">
          ISH MAYDONI
        </div>

        <nav aria-label="Asosiy menyu">
          {navigation.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-label={item.label}
              aria-current={
                page === item.id ? "page" : undefined
              }
              className={`nav-item ${
                page === item.id ? "active" : ""
              }`}
              onClick={() => navigate(item.id)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="clear-data-button"
          aria-label="Barcha ma’lumotlarni tozalash"
          title="Tozalash"
          onClick={openClearModal}
        >
          <Icon name="delete" size={19} />
          <span>Tozalash</span>
        </button>

        <div className="sidebar-bottom">
          <div className="local-dot" />

          <StorageStatus />
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <span className="breadcrumb">
            Ish maydoni <span>/</span>{" "}
            <strong>
              {
                navigation.find((item) => item.id === page)
                  ?.label
              }
            </strong>
          </span>

          <button
            type="button"
            className="button secondary export-button"
            onClick={() => setBackupsOpen(true)}
          >
            <Icon name="download" size={17} />
            <span>Zaxira va tiklash</span>
          </button>
        </header>

        <main>{children}</main>

        <footer className="app-footer">
          Ta’minot · Sodda hisob, aniq nazorat.
        </footer>
      </div>

      {backupsOpen && <BackupManager onClose={() => setBackupsOpen(false)} />}
      {confirmClear && (
        <Modal
          title="Barcha ma’lumotlar tozalansinmi?"
          onClose={() => setConfirmClear(false)}
        >
          <p className="confirm-text">
            Barcha ta’minotchilar, kategoriyalar, mahsulotlar,
            qo‘shimcha mahsulotlar,
            to‘lovlar va sarf tarixi faol ro‘yxatdan tozalanadi.
            ID hisoblagichlari ham noldan boshlanadi.
            Tozalashdan oldingi holat zaxira tarixida saqlanadi.
          </p>

          {clearError && (
            <p className="form-error" role="alert">
              {clearError}
            </p>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => setConfirmClear(false)}
            >
              Bekor qilish
            </button>

            <button
              type="button"
              className="button destructive"
              onClick={handleClear}
            >
              Hammasini tozalash
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
