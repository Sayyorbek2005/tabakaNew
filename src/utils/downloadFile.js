// Keep the URL alive until the browser has finished starting the download.
export function downloadFile(blob, filename) {
  if (!blob.size) throw new Error("Yuklanadigan fayl bo‘sh.");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  try { link.click(); }
  catch (error) { link.remove(); URL.revokeObjectURL(url); throw error; }
  setTimeout(() => link.remove(), 1000);
  // Also returned for an explicit, user-initiated download on mobile browsers.
  return { url, filename };
}

export function csvBlob(headers, rows) {
  const cell = (value) => {
    let text = String(value ?? "");
    // Product names must remain text when opened in Excel.
    if (/^[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const csv = [headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
  return new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
}
