import { parseDateInput } from "./dateInput";

export function normalizeSearch(value) {
  return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("uz-UZ").replace(/[‘’ʻʼ`´'ʹʽˈ]/g, "")
    .replace(/\s+/g, " ").trim();
}

export function matchesSearch(query, values) {
  const haystack = normalizeSearch(values.filter((value) => value != null).join(" "));
  return normalizeSearch(query).split(" ").filter(Boolean).every((token) => {
    if (haystack.includes(token)) return true;
    if (/^[+\d()-]+$/.test(token)) {
      const digits = token.replace(/\D/g, "");
      return !!digits && values.some((value) => String(value ?? "").replace(/\D/g, "").includes(digits));
    }
    return false;
  });
}

export function dateKey(value) {
  const text = String(value ?? "").trim();
  const iso = text.match(/^(\d{4}-\d{2}-\d{2})(?:$|T| )/);
  if (iso) return parseDateInput(iso[1].split("-").reverse().join("."));
  return parseDateInput(text.replace(/\//g, "."));
}

export function matchesDateRange(value, from, to) {
  if (!from && !to) return true;
  const date = dateKey(value);
  if (from && !to) return !!date && date === from;
  return !!date && (!from || date >= from) && (!to || date <= to);
}
