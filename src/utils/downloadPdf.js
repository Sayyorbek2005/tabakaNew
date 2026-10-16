let fontPromise;

async function loadFont() {
  if (!fontPromise) {
    fontPromise = (async () => {
      const response = await fetch(`${process.env.PUBLIC_URL || ""}/fonts/NotoSans-Regular.ttf`);
      if (!response.ok) throw new Error("PDF shrifti yuklanmadi.");
      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = "";
      for (let offset = 0; offset < bytes.length; offset += 8192) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
      }
      return btoa(binary);
    })().catch((error) => { fontPromise = null; throw error; });
  }
  return fontPromise;
}

export async function createReportPdf(report, fontData) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const landscape = report.sections.some((section) => section.headers.length > 5);
  const pdf = new jsPDF({ orientation: landscape ? "landscape" : "portrait", unit: "mm", format: "a4", putOnlyUsedFonts: true });
  pdf.addFileToVFS("NotoSans-Regular.ttf", fontData);
  pdf.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  pdf.setFont("NotoSans", "normal");
  pdf.setProperties({ title: String(report.title), creator: "Ta’minot" });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  let y = 17;

  function paragraph(text, size = 10, color = [35, 58, 50]) {
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(String(text ?? ""), width - 28);
    for (const line of lines) {
      if (y > height - 22) { pdf.addPage(); y = 17; }
      pdf.text(line, 14, y);
      y += size * .47;
    }
    y += 3;
  }

  paragraph(report.title, 18, [23, 79, 70]);
  paragraph(`Tayyorlangan vaqt: ${new Date().toLocaleString("uz-UZ")}`, 9, [110, 128, 118]);
  for (const line of report.meta || []) paragraph(line);

  for (const section of report.sections) {
    if (y > height - 42) { pdf.addPage(); y = 17; }
    paragraph(section.title, 12, [23, 79, 70]);
    autoTable(pdf, {
      startY: y,
      head: [section.headers.map(String)],
      body: section.rows.length ? section.rows.map((row) => row.map((value) => String(value ?? "—"))) : [["Yozuv yo‘q."]],
      margin: { left: 14, right: 14, top: 17, bottom: 20 },
      styles: { font: "NotoSans", fontStyle: "normal", fontSize: 9, cellPadding: 3, overflow: "linebreak", textColor: [35, 58, 50], lineColor: [220, 229, 223], lineWidth: .15 },
      headStyles: { fillColor: [234, 243, 237], textColor: [23, 79, 70], fontStyle: "normal" },
      alternateRowStyles: { fillColor: [249, 251, 249] },
      rowPageBreak: "avoid",
    });
    y = pdf.lastAutoTable.finalY + 10;
  }

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    pdf.setFontSize(8);
    pdf.setTextColor(110, 128, 118);
    pdf.text("Ta’minot · Hisob nazorati", 14, height - 9);
    pdf.text(`${page} / ${pages}`, width - 14, height - 9, { align: "right" });
  }
  return pdf;
}

export async function downloadReportPdf(report) {
  const pdf = await createReportPdf(report, await loadFont());
  const filename = Array.from(String(report.title || "hisobot"))
    .map((character) => character.charCodeAt(0) < 32 ? "-" : character).join("")
    .replace(/[<>:"/\\|?*]/g, "-").slice(0, 120);
  await pdf.save(`${filename}.pdf`, { returnPromise: true });
}
