import { printReport } from "../utils/reports";
import { useState } from "react";
import { downloadReportPdf } from "../utils/downloadPdf";
import Icon from "./Icon";
import "./PdfButton.css";

export default function PdfButton({
  report,
  label = "PDF / Chop etish",
  downloadable = false,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    setBusy(true);
    setError("");
    try {
      await downloadReportPdf(report);
    } catch {
      setError("PDF saqlanmadi. Qayta urinib ko‘ring.");
    } finally {
      setBusy(false);
    }
  }

  if (downloadable) return (
    <div className="pdf-actions">
      <button type="button" className="button secondary" disabled={busy} onClick={download}>
        <Icon name="download" size={17} />{busy ? "Tayyorlanmoqda…" : "PDF saqlash"}
      </button>
      <button type="button" className="button secondary" onClick={() => printReport(report)}>Chop etish</button>
      {error && <span className="pdf-download-error" role="alert">{error}</span>}
    </div>
  );

  return (
    <button
      type="button"
      className="button secondary"
      onClick={() => printReport(report)}
    >
      <Icon name="download" size={17} />
      {label}
    </button>
  );
}
