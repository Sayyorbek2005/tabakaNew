import { useEffect, useState } from "react";
import { useStore } from "./context/StoreContext";

import Layout, { navigation } from "./components/Layout";
import Modal from "./components/Modal";
import RecordForm from "./components/RecordForm";

import Dashboard from "./pages/Dashboard";
import Suppliers from "./pages/Suppliers";
import Products from "./pages/Products";
import AdditionalProducts from "./pages/AdditionalProducts";
import Categories from "./pages/Categories";
import Payments from "./pages/Payments";

// ?app
import "./App.css";

const getPage = () => {
  const page = window.location.hash.slice(1);
  return navigation.some((item) => item.id === page)
    ? page
    : "dashboard";
};

const titles = {
  supplier: "Ta’minotchi",
  category: "Kategoriya",
  product: "Mahsulot kirimi",
  payment: "To‘lov",
};

export default function App() {
  const { data, toast, error, notify, remove, exportData } = useStore();

  const [page, setPage] = useState(getPage);
  const [form, setForm] = useState(null);
  const [deletion, setDeletion] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const handler = () => setPage(getPage());
    window.addEventListener("hashchange", handler);

    return () => window.removeEventListener("hashchange", handler);
  }, []);

  function navigate(id) {
    window.location.hash = id;
    setPage(id);
    window.scrollTo({ top: 0 });
  }

  function openForm(type, record = null, supplierId = "") {
    const hasSupplier = data.suppliers.some((item) => !item.deletedAt);

    if (
      type === "product" &&
      (!hasSupplier || !data.categories.length)
    ) {
      notify("Avval ta’minotchi va kategoriya yarating.");
      navigate(!hasSupplier ? "suppliers" : "categories");
      return;
    }

    if (type === "payment" && !data.products.length) {
      notify("Avval mahsulot kirimini yarating.");
      navigate("products");
      return;
    }

    setForm({ type, record, supplierId });
  }

  function confirmDelete(type, id) {
    setDeleteError("");
    setDeletion({ type, id });
  }

  function deleteRecord() {
    try {
      remove(deletion.type, deletion.id);
      setDeletion(null);
    } catch (error) {
      setDeleteError(error.message);
    }
  }

  const props = { navigate, openForm, confirmDelete };

  return (
    <Layout page={page} navigate={navigate} onExport={exportData}>
      {error && (
        <p className="form-error" role="alert">{error}</p>
      )}

      {page === "dashboard" && <Dashboard {...props} />}
      {page === "suppliers" && <Suppliers {...props} />}
      {page === "products" && <Products {...props} />}
      {page === "additional-products" && <AdditionalProducts />}
      {page === "categories" && <Categories {...props} />}
      {page === "payments" && <Payments {...props} />}

      {form && (
        <Modal
          title={`${titles[form.type]} ${
            form.record?.id ? "tahrirlash" : "qo‘shish"
          }`}
          onClose={() => setForm(null)}
        >
          <RecordForm {...form} onClose={() => setForm(null)} />
        </Modal>
      )}

      {deletion && (
        <Modal
          title={
            deletion.type === "payments"
              ? "To‘lovni bekor qilasizmi?"
              : "Haqiqatan o‘chirmoqchimisiz?"
          }
          onClose={() => setDeletion(null)}
        >
          <p className="confirm-text">
            {deletion.type === "payments"
              ? "To‘lov bekor qilinadi va tegishli mahsulotlar qarzi qayta hisoblanadi."
              : deletion.type === "suppliers"
                ? "Qarzi nol bo‘lgan ta’minotchi ro‘yxatdan olib tashlanadi. Uning kirim va to‘lov tarixi saqlanadi."
                : "Ushbu yozuv o‘chiriladi."}
          </p>

          {deleteError && (
            <p className="form-error" role="alert">{deleteError}</p>
          )}

          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setDeletion(null)}
            >
              Bekor qilish
            </button>

            <button
              className="button destructive"
              onClick={deleteRecord}
            >
              Tasdiqlash
            </button>
          </div>
        </Modal>
      )}

      {toast && (
        <div className="toast" role="status">{toast}</div>
      )}
    </Layout>
  );
}
