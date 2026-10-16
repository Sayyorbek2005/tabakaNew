import { useEffect } from "react";

export default function DownloadLink({ file }) {
  useEffect(() => () => { if (file) URL.revokeObjectURL(file.url); }, [file]);
  if (!file) return null;
  return <a className="text-button" href={file.url} download={file.filename}>Fayl tayyor: {file.filename} — yuklab olish</a>;
}
