export function maskDate(value, previous = "", autoAdvance = true) {
  const parts = String(value).split(".");
  if (autoAdvance) {
    for (let index = 0; index < Math.min(parts.length - 1, 2); index += 1) {
      if (/^[1-9]$/.test(parts[index])) parts[index] = `0${parts[index]}`;
    }
  }
  let digits = parts.join("").replace(/\D/g, "");
  let result = "";
  for (const limit of [31, 12]) {
    if (!digits) return result;
    const padSingle = autoAdvance && Number(digits[0]) > Math.floor(limit / 10);
    const segment = padSingle ? `0${digits[0]}` : digits.slice(0, 2);
    digits = digits.slice(padSingle ? 1 : 2);
    if (segment.length === 2 && (Number(segment) < 1 || Number(segment) > limit)) return previous;
    result += segment;
    if (segment.length < 2) return result;
    if (autoAdvance || digits) result += ".";
  }
  return result + digits.slice(0, 4);
}

export function parseDateInput(value) {
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(value)) return "";
  const [day, month, year] = value.split(".").map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return "";
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day > days[month - 1]) return "";
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Format the segment being edited, without rebuilding untouched day/month parts.
export function editDateInput(raw, previous, caret, deleting = false) {
  const text = String(raw).replace(/[^0-9.]/g, "");
  if (!text.includes(".")) {
    const next = maskDate(text, previous, !deleting);
    return { text: next, caret: caret === raw.length ? next.length : Math.min(caret, next.length) };
  }
  const parts = text.split(".");
  const active = text.slice(0, caret).split(".").length - 1;
  if (parts.length > 3) return { text: previous, caret: Math.max(0, caret - 1) };
  let position = caret;
  const insertedSeparator = !deleting && text[caret - 1] === "." &&
    parts.length > previous.split(".").length;
  if (insertedSeparator && active > 0 && active < 3 && /^[1-9]$/.test(parts[active - 1])) {
    parts[active - 1] = `0${parts[active - 1]}`;
    position += 1;
  }
  for (let index = 0; index < parts.length; index += 1) {
    const limit = index === 0 ? 31 : 12;
    if (parts[index].length > (index === 2 ? 4 : 2)) return { text: previous, caret: Math.max(0, caret - 1) };
    if (index === 2) continue;
    if (parts[index].length === 2 && (Number(parts[index]) < 1 || Number(parts[index]) > limit)) return { text: previous, caret: Math.max(0, caret - 1) };
    if (!deleting && index === active) {
      if (parts[index].length === 1 && Number(parts[index]) > Math.floor(limit / 10)) {
        parts[index] = `0${parts[index]}`;
        position += 1;
      }
      if (parts[index].length === 2) {
        if (parts.length === index + 1) parts.push("");
        position = parts.slice(0, index + 1).join(".").length + 1;
      }
    }
  }
  const next = parts.join(".");
  return { text: next, caret: Math.min(position, next.length) };
}
