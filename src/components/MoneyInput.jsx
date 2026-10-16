import { useRef } from "react";
import { cleanMoneyInput, formatMoneyInput } from "../utils/moneyInput";

export default function MoneyInput({ value, onValueChange, ...props }) {
  const input = useRef(null);
  const formatted = formatMoneyInput(value);

  function change(text, caret) {
    const raw = cleanMoneyInput(text, String(value ?? ""));
    const significantBeforeCaret = text.slice(0, caret).replace(/,/g, "").length;
    onValueChange(raw);
    requestAnimationFrame(() => {
      if (!input.current || document.activeElement !== input.current) return;
      const next = input.current.value;
      let position = 0;
      let count = 0;
      while (position < next.length && count < significantBeforeCaret) {
        if (next[position] !== ",") count += 1;
        position += 1;
      }
      input.current.setSelectionRange(position, position);
    });
  }

  return (
    <input {...props} ref={input} type="text" inputMode="decimal" autoComplete="off"
      value={formatted}
      onChange={(event) => change(event.target.value, event.target.selectionStart ?? event.target.value.length)}
      onKeyDown={(event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.key.length === 1 && !/[0-9.]/.test(event.key)) event.preventDefault();
        const { selectionStart: start, selectionEnd: end } = event.currentTarget;
        if (start !== end) return;
        if (event.key === "Backspace" && formatted[start - 1] === ",") {
          event.preventDefault();
          change(formatted.slice(0, start - 2) + formatted.slice(start), start - 2);
        } else if (event.key === "Delete" && formatted[start] === ",") {
          event.preventDefault();
          change(formatted.slice(0, start) + formatted.slice(start + 2), start);
        }
      }} />
  );
}
