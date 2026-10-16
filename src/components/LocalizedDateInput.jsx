import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { editDateInput, parseDateInput } from "../utils/dateInput";
import "./LocalizedDateInput.css";

export default function LocalizedDateInput({ value = "", onChange, min, max, resetKey = 0, ...props }) {
  const [draft, setDraft] = useState(() => value.split("-").reverse().join("."));
  const [blurred, setBlurred] = useState(false);
  const emitted = useRef(value);
  const previousReset = useRef(resetKey);
  const calendar = useRef(null);
  const textInput = useRef(null);
  const pendingCaret = useRef(null);
  const errorId = useId();
  const [language, setLanguage] = useState(() => document.documentElement.lang || "uz");

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setLanguage(document.documentElement.lang || "uz");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (value !== emitted.current || resetKey !== previousReset.current) {
      emitted.current = value;
      previousReset.current = resetKey;
      setDraft(value.split("-").reverse().join("."));
      setBlurred(false);
    }
  }, [value, resetKey]);

  useLayoutEffect(() => {
    if (pendingCaret.current !== null && document.activeElement === textInput.current) {
      textInput.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
    }
    pendingCaret.current = null;
  }, [draft]);

  const placeholder = language.startsWith("ru") ? "ДД.ММ.ГГГГ"
    : language.startsWith("en") ? "DD.MM.YYYY" : "KK.OO.YYYY";
  const parsed = parseDateInput(draft);
  const invalid = !!draft && ((!parsed && (draft.length === 10 || blurred)) ||
    (parsed && ((min && parsed < min) || (max && parsed > max))));
  const error = parsed ? "Sana tanlangan oraliqqa mos emas." : "Sanani KK.OO.YYYY shaklida to‘g‘ri kiriting.";

  function update(next) {
    setDraft(next);
    setBlurred(false);
    const iso = parseDateInput(next);
    const accepted = iso;
    emitted.current = accepted;
    onChange?.({ target: { value: accepted } });
  }

  return (
    <span className={`localized-date-input${invalid ? " invalid" : ""}`}>
      <input {...props} ref={textInput} className="date-text-input" type="text" inputMode="numeric"
        autoComplete="off" placeholder={placeholder} maxLength={10} value={draft}
        aria-invalid={invalid ? true : undefined} aria-describedby={invalid ? errorId : undefined}
        onChange={(event) => {
          const deleting = event.nativeEvent.inputType?.startsWith("delete");
          const result = editDateInput(event.target.value, draft, event.target.selectionStart ?? event.target.value.length, deleting);
          pendingCaret.current = result.caret;
          event.target.value = result.text;
          event.target.setSelectionRange(result.caret, result.caret);
          update(result.text);
        }}
        onBlur={() => setBlurred(true)}
        onKeyDown={(event) => {
          if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1 && !/[0-9.]/.test(event.key)) event.preventDefault();
          const { selectionStart: start, selectionEnd: end } = event.currentTarget;
          if (start === end && event.key === "Backspace" && draft[start - 1] === ".") {
            event.preventDefault();
            const next = draft.slice(0, Math.max(0, start - 2)) + draft.slice(start - 1);
            pendingCaret.current = Math.max(0, start - 2);
            update(next === "." ? "" : next);
          }
        }} />
      <button className="date-calendar-button" type="button" aria-label={`${props["aria-label"] || "Sana"}: taqvimni ochish`}
        onClick={() => calendar.current?.showPicker?.()}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <rect x="4" y="5" width="16" height="16" rx="3" /><path d="M8 3v4m8-4v4M4 11h16" />
        </svg>
      </button>
      <input className="date-native-picker" ref={calendar} type="date" lang={language}
        value={value} min={min} max={max} tabIndex={-1} aria-hidden="true"
        onChange={(event) => update(event.target.value.split("-").reverse().join("."))} />
      {invalid && <small className="date-input-error" id={errorId} role="status">{error}</small>}
    </span>
  );
}
