import {
  Fragment,
  createContext,
  useContext,
  useRef,
  useState,
} from "react";

import {
  emptyStore,
  loadStore,
  saveStore,
} from "../services/localRepository";
import { clearAdditionalProducts } from "../services/additionalProductRepository";
import { downloadFullBackup } from "../services/backups";

import {
  allocatePayment,
  paidOf,
  positive,
  totalOf,
  round,
  totals,
} from "../utils/accounting";

import {
  qty,
  usedOf,
  remainingOf,
} from "../utils/inventory";

const Context = createContext(null);

const text = (value) => String(value ?? "").trim();

function checkDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Sanani kiriting.");
  }
}

function productValues(input, store) {
  if (!text(input.name)) {
    throw new Error("Mahsulot nomini kiriting.");
  }

  if (!store.suppliers.some((item) => item.id === input.supplierId)) {
    throw new Error("Ta’minotchini tanlang.");
  }

  if (!store.categories.some((item) => item.id === input.categoryId)) {
    throw new Error("Kategoriyani tanlang.");
  }

  if (!["kg", "litr", "dona"].includes(input.unit)) {
    throw new Error("Birlikni tanlang.");
  }

  checkDate(input.date);

  const values = {
    name: text(input.name),
    supplierId: input.supplierId,
    categoryId: input.categoryId,
    unit: input.unit,
    quantity: positive(
      input.quantity,
      "Miqdor",
      input.unit === "dona" ? 0 : 3
    ),
    price: positive(input.price, "Narx"),
    date: input.date,
    note: text(input.note),
  };

  const total = totalOf(values);

  if (total <= 0 || total > Number.MAX_SAFE_INTEGER / 100) {
    throw new Error(
      "Kirim summasi hisoblash chegarasidan tashqarida."
    );
  }

  return values;
}

export function StoreProvider({ children }) {
  const [initial] = useState(() => {
    try {
      return {
        data: loadStore(),
        error: "",
      };
    } catch (error) {
      return {
        data: emptyStore(),
        error: error.message,
      };
    }
  });

  const [data, setData] = useState(initial.data);
  const [storageError, setStorageError] = useState(initial.error);
  const [resetVersion, setResetVersion] = useState(0);
  const [toast, setToast] = useState("");

  const current = useRef(initial.data);
  const timer = useRef(null);

  function notify(message) {
    clearTimeout(timer.current);
    setToast(message);

    timer.current = setTimeout(() => {
      setToast("");
    }, 4000);
  }

  function commit(change) {
    if (storageError) {
      throw new Error(storageError);
    }

    const next = JSON.parse(JSON.stringify(current.current));
    const result = change(next);

    try {
      saveStore(next);
    } catch {
      throw new Error(
        "Saqlash amalga oshmadi. Brauzer xotirasini tekshiring."
      );
    }

    current.current = next;
    setData(next);

    return result;
  }

  function createId(store, type, prefix) {
    store.counters[type] += 1;

    return {
      id: crypto.randomUUID(),
      code: `${prefix}-${String(store.counters[type]).padStart(4, "0")}`,
    };
  }

  function pushPayment(store, input) {
    const amount = positive(input.amount, "To‘lov");

    if (!["cash", "card"].includes(input.method)) {
      throw new Error("To‘lov turini tanlang.");
    }

    checkDate(input.date);

    const supplier = store.suppliers.find(
      (item) => item.id === input.supplierId
    );

    if (!supplier) {
      throw new Error("Ta’minotchini tanlang.");
    }

    if (supplier.deletedAt) {
      throw new Error("Bu ta’minotchi arxivlangan.");
    }

    const allocations = allocatePayment(
      store.products,
      store.payments,
      input.supplierId,
      input.productId,
      amount
    );

    store.payments.push({
      ...createId(store, "payment", "TOL"),
      supplierId: input.supplierId,
      amount,
      method: input.method,
      date: input.date,
      note: text(input.note),
      allocations,
    });
  }

  function createSupplierEntry(input) {
    const result = commit((store) => {
      checkDate(input.date);

      if (!input.items?.length) {
        throw new Error("Kamida bitta mahsulot kiriting.");
      }

      let supplier;

      if (input.supplierId) {
        supplier = store.suppliers.find(
          (item) => item.id === input.supplierId
        );

        if (!supplier || supplier.deletedAt) {
          throw new Error("Faol ta’minotchini tanlang.");
        }
      } else {
        const name = text(input.name);

        if (!name) {
          throw new Error("Ta’minotchi nomini kiriting.");
        }

        supplier = {
          ...createId(store, "supplier", "TAM"),
          name,
          phone: text(input.phone),
          note: text(input.note),
          createdAt: new Date().toISOString(),
        };

        store.suppliers.push(supplier);
      }

      const added = input.items.map((row, index) => {
        let categoryId = row.categoryId;

        if (categoryId === "new") {
          const name = text(row.categoryName);

          if (!name) {
            throw new Error(
              `${index + 1}-mahsulot uchun kategoriya nomini kiriting.`
            );
          }

          let category = store.categories.find(
            (item) => item.name.toLowerCase() === name.toLowerCase()
          );

          if (!category) {
            category = {
              ...createId(store, "category", "KAT"),
              name,
            };

            store.categories.push(category);
          }

          categoryId = category.id;
        }

        const values = productValues(
          {
            ...row,
            categoryId,
            supplierId: supplier.id,
            date: input.date,
            note: text(row.note) || text(input.note),
          },
          store
        );

        const product = {
          ...createId(store, "product", "MHS"),
          ...values,
        };

        store.products.push(product);

        return product;
      });

      const total = round(
        added.reduce((sum, product) => sum + totalOf(product), 0)
      );

      const amountOf = (value, label) =>
        Number(value) === 0 ? 0 : positive(value, label);

      const cash = amountOf(input.cash, "Naqd to‘lov");
      const card = amountOf(input.card, "Karta to‘lovi");

      if (round(cash + card) > total) {
        throw new Error(
          "To‘lovlar jami yangi kirim summasidan oshmasin."
        );
      }

      for (const [method, amount] of [
        ["cash", cash],
        ["card", card],
      ]) {
        if (amount <= 0) continue;

        const allocations = allocatePayment(
          added,
          store.payments,
          supplier.id,
          "",
          amount
        );

        store.payments.push({
          ...createId(store, "payment", "TOL"),
          supplierId: supplier.id,
          amount,
          method,
          date: input.date,
          note: text(input.note) || "Kirim bilan kiritilgan to‘lov",
          allocations,
        });
      }

      return {
        ...supplier,
        productIds: added.map((product) => product.id),
      };
    });

    notify("Ta’minotchi kirimlari va to‘lovlar saqlandi.");

    return result;
  }

  function saveSupplier(input, id) {
    commit((store) => {
      const values = {
        name: text(input.name),
        phone: text(input.phone),
        note: text(input.note),
      };

      if (!values.name) {
        throw new Error("Ta’minotchi nomini kiriting.");
      }

      if (id) {
        const item = store.suppliers.find(
          (supplier) => supplier.id === id
        );

        if (!item) {
          throw new Error("Ta’minotchi topilmadi.");
        }

        Object.assign(item, values);
      } else {
        store.suppliers.push({
          ...createId(store, "supplier", "TAM"),
          ...values,
          createdAt: new Date().toISOString(),
        });
      }
    });

    notify("Ta’minotchi saqlandi.");
  }

  function saveCategory(input, id) {
    commit((store) => {
      const name = text(input.name);

      if (!name) {
        throw new Error("Kategoriya nomini kiriting.");
      }

      const exists = store.categories.some(
        (category) =>
          category.id !== id &&
          category.name.toLowerCase() === name.toLowerCase()
      );

      if (exists) {
        throw new Error("Bu kategoriya mavjud.");
      }

      if (id) {
        const item = store.categories.find(
          (category) => category.id === id
        );

        if (!item) {
          throw new Error("Kategoriya topilmadi.");
        }

        item.name = name;
      } else {
        store.categories.push({
          ...createId(store, "category", "KAT"),
          name,
        });
      }
    });

    notify("Kategoriya saqlandi.");
  }

  function saveProduct(input, id) {
    commit((store) => {
      const values = productValues(input, store);

      const supplier = store.suppliers.find(
        (item) => item.id === values.supplierId
      );

      if (supplier.deletedAt) {
        throw new Error(
          "Arxivdagi ta’minotchi mahsuloti tahrirlanmaydi; sarf kiritish mumkin."
        );
      }

      if (id) {
        const item = store.products.find(
          (product) => product.id === id
        );

        if (!item) {
          throw new Error("Mahsulot topilmadi.");
        }

        const paid = paidOf(id, store.payments);
        const used = usedOf(id, store.usages);

        if (values.quantity < used) {
          throw new Error(
            "Miqdor ishlatilgan miqdordan kam bo‘lmasin."
          );
        }

        if (
          used > 0 &&
          (
            values.quantity !== item.quantity ||
            values.unit !== item.unit ||
            values.supplierId !== item.supplierId
          )
        ) {
          throw new Error(
            "Sarfi bor mahsulotning miqdori, birligi va ta’minotchisi o‘zgartirilmaydi."
          );
        }

        if (values.supplierId !== item.supplierId && paid > 0) {
          throw new Error(
            "To‘lovli kirimning ta’minotchisini o‘zgartirib bo‘lmaydi."
          );
        }

        if (totalOf(values) < paid) {
          throw new Error(
            "Jami summa to‘langan summadan kam bo‘lmasin."
          );
        }

        Object.assign(item, values);
      } else {
        const product = {
          ...createId(store, "product", "MHS"),
          ...values,
        };
        const amounts = [Number(input.cash || 0), Number(input.card || 0)];
        if (amounts.some((amount) => !Number.isFinite(amount) || amount < 0)) {
          throw new Error("To‘lov summasi to‘g‘ri musbat son bo‘lsin.");
        }
        if (round(amounts[0] + amounts[1]) > totalOf(product)) {
          throw new Error("To‘lovlar jami kirim summasidan oshmasin.");
        }
        store.products.push(product);
        ["cash", "card"].forEach((method, index) => {
          if (amounts[index] > 0) pushPayment(store, {
            supplierId: product.supplierId, productId: product.id,
            amount: amounts[index], method, date: product.date,
            note: text(input.paymentNote) || "Kirim bilan kiritilgan to‘lov",
          });
        });
      }
    });

    notify("Mahsulot kirimi saqlandi.");
  }

  function addPayment(input) {
    commit((store) => {
      pushPayment(store, input);
    });

    notify("To‘lov qayd qilindi.");
  }

  function addUsage(input) {
    commit((store) => {
      const product = store.products.find(
        (item) => item.id === input.productId
      );

      if (!product) {
        throw new Error("Mahsulotni tanlang.");
      }

      const quantity = positive(
        input.quantity,
        "Ishlatilgan miqdor",
        product.unit === "dona" ? 0 : 3
      );

      checkDate(input.date);

      const previous = store.usages.filter(
        (usage) => usage.productId === product.id
      );

      const lastDate = previous.reduce(
        (date, usage) => usage.date > date ? usage.date : date,
        product.date
      );

      if (input.date < lastDate) {
        throw new Error(
          "Sarf sanasi kirim yoki oxirgi sarf sanasidan oldin bo‘lmasin."
        );
      }

      const before = remainingOf(product, store.usages);

      if (quantity > before) {
        throw new Error(
          `Qoldiq yetarli emas: ${before} ${product.unit}.`
        );
      }

      store.usages.push({
        ...createId(store, "usage", "SRF"),
        productId: product.id,
        quantity,
        unit: product.unit,
        before,
        after: qty(before - quantity),
        date: input.date,
        createdAt: new Date().toISOString(),
        note: text(input.note),
      });
    });

    notify("Sarf va qoldiq tarixi saqlandi.");
  }

  function remove(type, id) {
    commit((store) => {
      if (type === "suppliers") {
        const supplier = store.suppliers.find(
          (item) => item.id === id
        );

        if (!supplier) {
          throw new Error("Ta’minotchi topilmadi.");
        }

        const products = store.products.filter(
          (product) => product.supplierId === id
        );

        if (totals(products, store.payments).debt !== 0) {
          throw new Error("Avval ta’minotchi qarzini to‘lang.");
        }

        supplier.deletedAt = new Date().toISOString();

        return;
      }

      if (
        type === "categories" &&
        store.products.some((product) => product.categoryId === id)
      ) {
        throw new Error("Kategoriyada mahsulot bor.");
      }

      if (
        type === "products" &&
        (
          paidOf(id, store.payments) > 0 ||
          usedOf(id, store.usages) > 0
        )
      ) {
        throw new Error(
          "To‘lov yoki sarf tarixi bor mahsulot o‘chirilmaydi."
        );
      }

      if (type === "payments") {
        const payment = store.payments.find(
          (item) => item.id === id
        );

        const supplier = payment
          ? store.suppliers.find(
              (item) => item.id === payment.supplierId
            )
          : null;

        if (supplier?.deletedAt) {
          throw new Error(
            "Arxivdagi ta’minotchi to‘lovi bekor qilinmaydi."
          );
        }
      }

      if (!["categories", "products", "payments"].includes(type)) {
        throw new Error("Noto‘g‘ri bo‘lim.");
      }

      store[type] = store[type].filter((item) => item.id !== id);
    });

    notify(
      type === "suppliers"
        ? "Ta’minotchi ro‘yxatdan olib tashlandi; tarixi saqlandi."
        : "Yozuv o‘chirildi."
    );
  }

  function clearData() {
    const next = emptyStore();

    try {
      saveStore(next);
      clearAdditionalProducts();
    } catch {
      throw new Error(
        "Tozalash amalga oshmadi. Brauzer xotirasini tekshiring."
      );
    }

    current.current = next;

    clearTimeout(timer.current);
    setToast("");
    setStorageError("");

    window.location.hash = "dashboard";

    setData(next);

    // Barcha sahifalar va ochiq oynalarni qayta boshlaydi.
    setResetVersion((value) => value + 1);
  }

  function exportData() {
    downloadFullBackup();
  }

  return (
    <Context.Provider
      value={{
        data,
        toast,
        notify,
        error: storageError,
        createSupplierEntry,
        addUsage,
        saveSupplier,
        saveCategory,
        saveProduct,
        addPayment,
        remove,
        exportData,
        clearData,
      }}
    >
      <Fragment key={resetVersion}>
        {children}
      </Fragment>
    </Context.Provider>
  );
}

export function useStore() {
  return useContext(Context);
}
