import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { StoreProvider } from "./context/StoreContext";
import "./index.css";
import { initializeStorage } from "./services/durableStorage";
import { browserStorageMode } from "./services/browserStorage";
const root = createRoot(document.getElementById("root"));
async function boot() {
  root.render(<p style={{ padding: 28 }}>Ma’lumotlar yuklanmoqda…</p>);
  let ready = false;
  try { ready = await initializeStorage(); } catch { /* Keep the app closed rather than show an empty store. */ }
  if (!ready) {
    root.render(<div role="alert" style={{ padding: 28 }}>
      <h2>Saqlangan ma’lumotlarga ulanib bo‘lmadi</h2>
      <p>{browserStorageMode ? "Ma’lumotlar o‘chirilmadi. Brauzer xotirasiga ruxsatni tekshiring. Saqlangan ma’lumot buzilgan bo‘lsa, uni o‘chirmasdan zaxira nusxasini saqlab oling." : "Ma’lumotlar o‘chirilmadi. Sayt serverini ishga tushirib, qayta urinib ko‘ring."}</p>
      <button type="button" onClick={boot}>Qayta yuklash</button>
    </div>);
    return;
  }
  root.render(
  <React.StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </React.StrictMode>,
  );
}
void boot();
