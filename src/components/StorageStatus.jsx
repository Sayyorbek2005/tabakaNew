import { useEffect, useState } from "react";
import { browserStorageMode } from "../services/browserStorage";
import { getStorageStatus, subscribeStorageStatus, retryDurableStorage } from "../services/durableStorage";

export default function StorageStatus() {
  const [state, setState] = useState(getStorageStatus);
  useEffect(() => subscribeStorageStatus(setState), []);
  return (
    <span role="status">
      {state.status === "saved" ? state.message : state.status === "saving" ? "Saqlanmoqda…" : "Brauzer nusxasi saqlangan"}
      <small>{browserStorageMode ? "Faqat shu brauzerda. Zaxira nusxa yuklab oling; qurilmalar sinxronlashmaydi." : state.status === "saved" ? "Alohida papka va tarix nusxalari mavjud" : state.message}</small>
      {state.status === "offline" && <button type="button" className="text-button" onClick={retryDurableStorage}>Qayta ulanish</button>}
    </span>
  );
}
