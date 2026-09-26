import React, { useRef, useState, useCallback } from "react";
import { FileKey, Upload, Loader2, FileUp, Lock, Files, FolderOpen, Trash2 } from "lucide-react";
import PageHeader, { SecurityNote } from "@/components/PageHeader";
import PasswordInput from "@/components/PasswordInput";
import SecurityBadge from "@/components/SecurityBadge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useI18n } from "@/lib/i18n";
import { downloadBytes, addHistory } from "@/lib/crypto";
import { packFolderFiles, unpackFolderBytes } from "@/lib/crypto/folder";
import { cn } from "@/lib/utils";

function createWorker() { return new Worker(new URL("../lib/crypto/file.worker.js", import.meta.url), { type: "module" }); }
function runWorkerBytes(buffer, password, type, onProgress) {
  return new Promise((resolve, reject) => {
    const worker = createWorker();
    const cleanup = () => worker.terminate();
    worker.onmessage = (e) => { const m = e.data; if (m.type === "progress") onProgress(m.progress); else if (m.type === "done") { resolve(new Uint8Array(m.buffer)); cleanup(); } else if (m.type === "error") { reject(new Error(m.message)); cleanup(); } };
    worker.onerror = (e) => { reject(new Error(e.message || "Worker failed")); cleanup(); };
    worker.postMessage({ type, buffer, password }, [buffer]);
  });
}
function runWorker(file, password, type, onProgress) { return file.arrayBuffer().then((b) => runWorkerBytes(b, password, type, onProgress)); }

export default function FileEncryption() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [mode, setMode] = useState("encrypt"), [files, setFiles] = useState([]), [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false), [progress, setProgress] = useState(0), [currentName, setCurrentName] = useState("");
  const [dragging, setDragging] = useState(false), [folderMode, setFolderMode] = useState(false);
  const inputRef = useRef(null), folderRef = useRef(null);

  const addPicked = useCallback((list) => {
    const arr = Array.from(list || []);
    if (!arr.length) return;
    setFiles((prev) => folderMode ? arr : mode === "encrypt" ? [...prev, ...arr] : [arr[0]]);
  }, [folderMode, mode]);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    // Browsers expose folder drops as the contained files; preserve their relative paths.
    addPicked(e.dataTransfer.files);
  }, [addPicked]);

  const process = async () => {
    if (!files.length) { toast({ title: t("common.nothing"), variant: "destructive" }); return; }
    if (!password) { toast({ title: t("common.passwordRequired"), variant: "destructive" }); return; }
    if (folderMode && mode === "encrypt" && !files.some((f) => f.webkitRelativePath)) {
      toast({ title: t("files.chooseFolder"), description: t("files.folderPacked"), variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      if (folderMode && mode === "encrypt") {
        setCurrentName("Packing folder…");
        const packed = await packFolderFiles(files); setProgress(0.1);
        const out = await runWorkerBytes(packed.buffer, password, "encrypt", (p) => setProgress(0.1 + p * 0.9));
        downloadBytes(out, "folder.ecf.enc");
        addHistory({ section: "File", method: "ECV2 + ECF1 folder container", mode: "encrypt-folder", bytes: out.length });
        toast({ title: t("common.encrypted"), description: t("files.encryptedFolder") });
      } else if (folderMode && mode === "decrypt") {
        const f = files[0]; setCurrentName(f.name);
        const packed = await runWorker(f, password, "decrypt", (p) => setProgress(p));
        const unpacked = await unpackFolderBytes(packed);
        for (const item of unpacked) downloadBytes(item.bytes, item.path, item.type || "application/octet-stream");
        addHistory({ section: "File", method: "ECV2 + ECF1 folder container", mode: "decrypt-folder", bytes: packed.length });
        toast({ title: t("common.decrypted"), description: `${unpacked.length} ${t("files.restoredFiles")}` });
      } else {
        const batch = mode === "decrypt" ? files.slice(0, 1) : files;
        for (const f of batch) {
          setCurrentName(f.name); setProgress(0);
          const out = await runWorker(f, password, mode, setProgress);
          const name = mode === "encrypt" ? f.name + ".enc" : f.name.replace(/\.enc$/i, "") || "decrypted.bin";
          downloadBytes(out, name); addHistory({ section: "File", method: "AES-256-GCM (ECV2 worker)", mode, bytes: out.length });
        }
        toast({ title: mode === "encrypt" ? t("common.encrypted") : t("common.decrypted"), description: `${batch.length} ${t("files.selectedFiles")}` });
      }
    } catch (e) { toast({ title: t("common.operationFailed"), description: e.message, variant: "destructive" }); }
    finally { setLoading(false); setCurrentName(""); setProgress(0); }
  };

  const switchMode = (md) => { setMode(md); setFiles([]); setFolderMode(false); };
  const toggleFolder = () => { setFolderMode((v) => !v); setFiles([]); };

  return <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
    <PageHeader icon={FileKey} title={t("files.title")} subtitle={t("files.subtitle")}><SecurityBadge level="secure" /></PageHeader>
    <SecurityNote variant="info">{t("files.workerNote")}</SecurityNote>
    <div className="mt-6 flex flex-wrap gap-2">
      <div className="inline-flex rounded-lg border border-border p-0.5">{["encrypt", "decrypt"].map((md) => <button key={md} onClick={() => switchMode(md)} className={`rounded-md px-4 py-1.5 text-sm font-medium ${mode === md ? "bg-red-500/15 text-red-400" : "text-muted-foreground"}`}>{md === "encrypt" ? t("common.encrypt") : t("common.decrypt")}</button>)}</div>
      <button onClick={toggleFolder} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${folderMode ? "border-red-500/50 bg-red-500/10 text-red-400" : "border-border text-muted-foreground"}`}><FolderOpen className="h-4 w-4" />{t("files.folderMode")}</button>
    </div>
    <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} onClick={() => (folderMode && mode === "encrypt" ? folderRef.current?.click() : inputRef.current?.click())} className={cn("mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition", dragging ? "border-red-500 bg-red-500/5" : "border-border hover:border-muted-foreground/50")}>
      <input ref={inputRef} type="file" multiple={mode === "encrypt" && !folderMode} className="hidden" onChange={(e) => { addPicked(e.target.files); e.currentTarget.value = ""; }} />
      <input ref={folderRef} type="file" webkitdirectory="" directory="" multiple className="hidden" onChange={(e) => { addPicked(e.target.files); e.currentTarget.value = ""; }} />
      <Upload className="h-9 w-9 text-muted-foreground" /><span className="mt-3 text-sm font-medium">{folderMode && mode === "encrypt" ? t("files.chooseFolder") : mode === "encrypt" ? t("files.dropEncrypt") : t("files.dropDecrypt")}</span><span className="mt-1 text-xs text-muted-foreground">{folderMode && mode === "encrypt" ? t("files.folderPacked") : t("files.nothingUploaded")}</span>
    </div>
    {files.length > 0 && <div className="mt-3 rounded-xl border border-border p-3"><div className="mb-2 flex items-center justify-between text-xs text-muted-foreground"><span>{folderMode ? `${files.length} ${t("files.folderFiles")}` : `${files.length} ${t("files.selectedFiles")}`}</span><button onClick={() => setFiles([])} className="inline-flex items-center gap-1 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" />{t("files.clearSelection")}</button></div><div className="max-h-48 space-y-1 overflow-auto">{files.map((f, i) => <div key={`${f.name}-${i}`} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-xs"><span className="flex min-w-0 items-center gap-2"><FileUp className="h-3.5 w-3.5 shrink-0 text-red-400" /><span className="truncate">{f.webkitRelativePath || f.name}</span><span className="shrink-0 text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</span></span></div>)}</div></div>}
    <div className="mt-5"><PasswordInput value={password} onChange={setPassword} /></div>
    {loading && <div className="mt-4 space-y-1.5"><div className="flex justify-between text-xs text-muted-foreground"><span className="truncate">{currentName}</span><span>{Math.round(progress * 100)}%</span></div><div className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${Math.max(2, progress * 100)}%` }} /></div></div>}
    <Button onClick={process} disabled={loading || !files.length} className="mt-5 w-full gap-2">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "encrypt" ? <Files className="h-4 w-4" /> : <Lock className="h-4 w-4" />}{folderMode ? (mode === "encrypt" ? t("files.encryptFolder") : t("files.decryptFolder")) : mode === "encrypt" ? `${t("files.encryptFiles")} (${files.length})` : t("files.decryptFile")}</Button>
    {folderMode && <p className="mt-3 text-xs leading-5 text-muted-foreground">{t("files.folderInfo")}</p>}
  </div>;
}
