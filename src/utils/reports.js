import {
  money,
  number,
  totalOf,
  paidOf,
  debtOf,
  totals,
} from "./accounting";

import { usedOf, remainingOf } from "./inventory";

const supplierName = (data, id) =>
  data.suppliers.find((supplier) => supplier.id === id)?.name || "—";

const categoryName = (data, id) =>
  data.categories.find((category) => category.id === id)?.name || "—";

export function productSection(data, products) {
  return {
    title: "Mahsulotlar",
    headers: [
      "ID / mahsulot",
      "Ta’minotchi / kategoriya",
      "Kirim",
      "Ishlatildi",
      "Qoldiq",
      "Birlik narxi",
      "Jami",
      "To‘langan",
      "Qarz",
    ],
    rows: products.map((product) => [
      `${product.code} · ${product.name}`,
      `${supplierName(data, product.supplierId)} / ${categoryName(
        data,
        product.categoryId
      )}`,
      `${number(product.quantity)} ${product.unit}`,
      `${number(usedOf(product.id, data.usages))} ${product.unit}`,
      `${number(remainingOf(product, data.usages))} ${product.unit}`,
      money(product.price),
      money(totalOf(product)),
      money(paidOf(product.id, data.payments)),
      money(debtOf(product, data.payments)),
    ]),
  };
}

export function usageSection(data, usages) {
  return {
    title: "Sarf va qoldiq tarixi",
    headers: [
      "ID",
      "Sana",
      "Mahsulot",
      "Oldin",
      "Ishlatildi",
      "Keyin",
      "Izoh",
    ],
    rows: usages.map((usage) => {
      const product = data.products.find(
        (item) => item.id === usage.productId
      );

      return [
        usage.code,
        usage.date,
        `${product?.code} · ${product?.name}`,
        `${number(usage.before)} ${usage.unit}`,
        `${number(usage.quantity)} ${usage.unit}`,
        `${number(usage.after)} ${usage.unit}`,
        usage.note || "—",
      ];
    }),
  };
}

function paymentSection(data, payments, productIds) {
  return {
    title: "To‘lovlar",
    headers: [
      "ID / sana",
      "Ta’minotchi",
      "Usul",
      "Hisobotga tegishli summa",
      "Umumiy to‘lov",
      "Taqsimot / izoh",
    ],
    rows: payments.map((payment) => {
      const allocations = productIds
        ? payment.allocations.filter((allocation) =>
            productIds.includes(allocation.productId)
          )
        : payment.allocations;

      const allocationText = allocations
        .map((allocation) => {
          const product = data.products.find(
            (item) => item.id === allocation.productId
          );

          return `${product?.code}: ${money(allocation.amount)}`;
        })
        .join("; ");

      return [
        `${payment.code} / ${payment.date}`,
        supplierName(data, payment.supplierId),
        payment.method === "cash" ? "Naqd" : "Karta",
        money(
          allocations.reduce(
            (sum, allocation) => sum + allocation.amount,
            0
          )
        ),
        money(payment.amount),
        allocationText +
          (payment.note ? ` · ${payment.note}` : ""),
      ];
    }),
  };
}

export function productsReport(
  data,
  products,
  title = "Mahsulotlar hisobi"
) {
  const ids = products.map((product) => product.id);
  const sums = totals(products, data.payments);

  return {
    title,
    meta: [
      `Jami kirim: ${money(sums.total)}`,
      `To‘langan: ${money(sums.paid)}`,
      `Qarz: ${money(sums.debt)}`,
    ],
    sections: [
      productSection(data, products),

      usageSection(
        data,
        (data.usages || []).filter((usage) =>
          ids.includes(usage.productId)
        )
      ),

      paymentSection(
        data,
        data.payments.filter((payment) =>
          payment.allocations.some((allocation) =>
            ids.includes(allocation.productId)
          )
        ),
        ids
      ),
    ],
  };
}

export function supplierReport(data, id) {
  const supplier = data.suppliers.find((item) => item.id === id);

  const report = productsReport(
    data,
    data.products.filter((product) => product.supplierId === id),
    `${supplier?.name} — ta’minotchi hisobi`
  );

  report.meta.unshift(
    `ID: ${supplier?.code}`,
    `Telefon: ${supplier?.phone || "—"}`,
    `Izoh: ${supplier?.note || "—"}`
  );

  return report;
}

export function paymentsReport(data, payments) {
  return {
    title: "To‘lovlar hisoboti",
    meta: [
      `Jami: ${money(
        payments.reduce((sum, payment) => sum + payment.amount, 0)
      )}`,
    ],
    sections: [paymentSection(data, payments)],
  };
}

export function usagesReport(data, products, usages) {
  return {
    title: "Qoldiqlar va sarf tarixi",
    meta: ["Turli birliklar alohida hisoblanadi."],
    sections: [
      productSection(data, products),
      usageSection(data, usages),
    ],
  };
}

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]
  );

export function reportHtml(report) {
  const sections = report.sections
    .map((section) => {
      const content = section.rows.length
        ? `
          <table>
            <thead>
              <tr>
                ${section.headers
                  .map((header) => `<th>${escapeHtml(header)}</th>`)
                  .join("")}
              </tr>
            </thead>
            <tbody>
              ${section.rows
                .map(
                  (row) => `<tr>${row
                    .map((value) => `<td>${escapeHtml(value)}</td>`)
                    .join("")}</tr>`
                )
                .join("")}
            </tbody>
          </table>
        `
        : "<p>Yozuv yo‘q.</p>";

      return `
        <section>
          <h2>${escapeHtml(section.title)}</h2>
          ${content}
        </section>
      `;
    })
    .join("");

  return `
    <!doctype html>
    <html lang="uz">
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(report.title)}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #233a32;
            font: 10px Arial, sans-serif;
          }
          h1 {
            margin: 0 0 8px;
            color: #174f46;
            font-size: 22px;
          }
          h2 { margin: 22px 0 10px; font-size: 14px; }
          p { margin: 5px 0; line-height: 1.6; }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          th, td {
            padding: 7px;
            border: 1px solid #dce5df;
            text-align: left;
            vertical-align: top;
            overflow-wrap: anywhere;
            line-height: 1.4;
          }
          th { background: #eaf3ed; font-size: 9px; }
          thead { display: table-header-group; }
          tr { break-inside: avoid; }
          footer {
            margin-top: 18px;
            color: #6c8076;
            font-size: 9px;
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(report.title)}</h1>
        <p>
          Tayyorlangan vaqt:
          ${escapeHtml(new Date().toLocaleString("uz-UZ"))}
        </p>
        ${(report.meta || [])
          .map((item) => `<p>${escapeHtml(item)}</p>`)
          .join("")}
        ${sections}
        <footer>
          Ta’minot · Hisobot joriy ma’lumotlar asosida tuzildi.
          Sarf miqdori to‘lov qarzini o‘zgartirmaydi.
        </footer>
      </body>
    </html>
  `;
}

export function printReport(report) {
  const frame = document.createElement("iframe");

  frame.title = report.title;
  frame.style.cssText =
    "position:fixed;left:-10000px;top:0;width:1200px;height:800px;border:0";

  frame.onload = async () => {
    try {
      await frame.contentDocument.fonts?.ready;

      frame.contentWindow.onafterprint = () => {
        setTimeout(() => frame.remove(), 0);
      };

      frame.contentWindow.focus();
      frame.contentWindow.print();
    } catch {
      frame.remove();
      alert("Chop etish oynasi ochilmadi. Brauzer ruxsatlarini tekshiring.");
    }
  };

  frame.srcdoc = reportHtml(report);
  document.body.appendChild(frame);

  setTimeout(() => frame.remove(), 120000);
}