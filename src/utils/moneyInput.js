// Keep grouping characters in the display; store a plain numeric string.
export function cleanMoneyInput(value, previous = "") {
  const text = String(value);
  if (/[^0-9,.\s]/.test(text)) return previous;
  const raw = text.replace(/[,\s]/g, "");
  if ((raw.match(/\./g) || []).length > 1) return previous;
  return raw.replace(/^0+(?=\d)/, "").replace(/^\./, "0.");
}

export function formatMoneyInput(value) {
  const text = String(value ?? "");
  if (!text) return "";
  const [integer, fraction] = text.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return grouped + (fraction === undefined ? "" : `.${fraction}`);
}
