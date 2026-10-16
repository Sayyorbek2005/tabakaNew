import { useEffect, useState } from "react";
import Modal from "./Modal";
import DownloadLink from "./DownloadLink";
import { downloadFullBackup, backupRequest, readBackupFile, applyRestoredCollection, preservePendingAndReload } from "../services/backups";
import { getStorageStatus } from "../services/durableStorage";
import { browserStorageMode } from "../services/browserStorage";
import "./BackupManager.css";

export default function BackupManager({ onClose }) {
  const [name, setName] = useState("main");
  const [history, setHistory] = useState({ snapshots: [], currentRevision: 0 });
  const [selected, setSelected] = useState("");
  const [imported, setImported] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [download, setDownload] = useState(null);
  useEffect(() => {
    let active = true;
    setLoading(true); setSelected(""); setError("");
    backupRequest(`/api/backups/${name}`).then((result) => { if (active) setHistory(result); })
      .catch((error) => { if (active) setError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [name]);
  const snapshot = history.snapshots.find((item) => item.id === selected);
  const incoming = imported?.[name];
  const canRestore = incoming !== undefined || !!snapshot;

  async function importFile(event) {
    const file = event.target.files[0];
    setError(""); setSelected("");
    if (!file) return;
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error("Fayl hajmi 8 MB dan oshmasin.");
      setImported(readBackupFile(await file.text()));
    } catch (error) { setImported(null); setError(error.message); }
  }
  async function restore() {
    setError("");
    if (getStorageStatus().status !== "saved") { setError("Avval joriy yozuvlar kompyuterga saqlanishini kuting. Zaxira faylini yuklab olish mumkin."); return; }
    setBusy(true);
    try {
      const result = await backupRequest(incoming !== undefined ? `/api/storage/${name}` : `/api/backups/${name}/${selected}/restore`, {
        method: incoming !== undefined ? "PUT" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: incoming, expectedRevision: history.currentRevision }),
      });
      const current = await backupRequest(`/api/storage/${name}`);
      applyRestoredCollection(name, current.data, result.revision);
      window.location.reload();
    } catch (error) { setError(error.message); setBusy(false); }
  }
  return (
    <Modal title="Zaxira va tiklash" onClose={onClose}>
      <div className="backup-manager">
        <p className="form-hint">{browserStorageMode ? "Yozuvlar shu saytning shu brauzer xotirasida saqlanadi. Oxirgi o‘zgarishdan oldingi bitta nusxa saqlanadi. Muntazam to‘liq JSON zaxirani yuklab oling. Boshqa qurilmaga shu fayldan tiklash mumkin." : "Har bir saqlashning oldingi holati alohida nusxada qoladi. Asosiy va qo‘shimcha mahsulotlar alohida tiklanadi."}</p>
        <button type="button" className="button secondary" onClick={() => { setError(""); try { setDownload(downloadFullBackup()); } catch (error) { setError(error.message); } }}>To‘liq zaxirani yuklab olish</button>
        <DownloadLink file={download} />
        {getStorageStatus().status === "conflict" && <button type="button" className="button secondary" onClick={async () => {
          setBusy(true);
          try { await preservePendingAndReload(); } catch (error) { setError(error.message); setBusy(false); }
        }} disabled={busy}>Brauzer nusxasini yuklab olib, serverdagi yangi holatni ochish</button>}
        <label className="field">Tiklanadigan bo‘lim<select value={name} onChange={(event) => setName(event.target.value)}>
          <option value="main">Asosiy hisob ma’lumotlari</option><option value="additional">Qo‘shimcha mahsulotlar</option>
        </select></label>
        <label className="field">Zaxira faylidan yuklash<input type="file" accept=".json,application/json" onChange={importFile} /></label>
        {imported && <p className="form-hint">{incoming === undefined ? "Tanlangan bo‘lim ushbu faylda yo‘q." : `Fayl tayyor: ${name === "additional" ? incoming.length : ["suppliers", "categories", "products", "payments", "usages"].reduce((sum, key) => sum + (incoming[key]?.length || 0), 0)} ta yozuv.`}</p>}
        <label className="field">Yoki oldingi saqlangan holat<select value={selected} disabled={loading || busy} onChange={(event) => { setSelected(event.target.value); setImported(null); }}>
          <option value="">{loading ? "Yuklanmoqda…" : "Nusxani tanlang"}</option>
          {history.snapshots.map((item) => <option key={item.id} value={item.id}>{browserStorageMode ? "Oxirgi o‘zgarishdan oldingi holat" : `${new Date(item.savedAt).toLocaleString("uz-UZ")} · №${item.revision}`} · {item.count} ta yozuv</option>)}
        </select></label>
        {canRestore && <div className="backup-confirm">Tanlangan bo‘lim eski holatga qaytariladi. Joriy holat avval zaxiraga olinadi.{snapshot && ` Tanlangan nusxa: ${snapshot.count} ta yozuv.`}</div>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions"><button type="button" className="button secondary" onClick={onClose}>Yopish</button>
          <button type="button" className="button" disabled={!canRestore || loading || busy} onClick={restore}>{busy ? "Tiklanmoqda…" : "Tanlangan holatni tiklash"}</button></div>
      </div>
    </Modal>
  );
}
