import "./DateRangeFilter.css";
import LocalizedDateInput from "./LocalizedDateInput";

export default function DateRangeFilter({ from, to, onFromChange, onToChange, resetKey = 0 }) {
  return (
    <>
      <label className="product-date-filter">
        <span>{to ? "Shu kundan" : "Shu kuni"}</span>
        <LocalizedDateInput aria-label="Shu kundan" value={from} resetKey={resetKey}
          onChange={(event) => {
            const next = event.target.value;
            if (next && to && next > to) onToChange("");
            onFromChange(next);
          }} />
      </label>
      <label className="product-date-filter">
        <span>Shu kungacha</span>
        <LocalizedDateInput aria-label="Shu kungacha" value={to} resetKey={resetKey}
          onChange={(event) => {
            const next = event.target.value;
            if (next && from && next < from) onFromChange("");
            onToChange(next);
          }} />
      </label>
    </>
  );
}
