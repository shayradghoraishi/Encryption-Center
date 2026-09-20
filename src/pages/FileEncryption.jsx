import React, { useState, useRef, useCallback } from "react";
import { FileKey, Upload, Download, Loader2, FileUp, Lock, Files } from "lucide-react";
import PageHeader, { SecurityNote } from "@/components/PageHeader";
import PasswordInput from "@/components/PasswordInput";
import SecurityBadge from "@/components/SecurityBadge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useI18n } from "@/lib/i18n";
import { downloadBytes, addHistory } from "@/lib/crypto";
import { cn } from "@/lib/utils";

function createWorker() {
  return new Worker(new URL("../lib/crypto/file.worker.js", import.meta.url), { type: "module" });
}

function runWorker(file, password, type, onProgress) {
  return new Promise((resolve, reject) => {
    const worker = createWorker();
    worker.onmessage = (e) => {
      const m = e.data;
      if (m.type === "progress") onProgress(m.progress);
      else if (m.type === "done") { resolve(new Uint8Array(m.buffer)); worker.terminate(); }
      else if (m.type === "error") { reject(new Error(m.message)); worker.terminate(); }
    };
    file.arrayBuffer().then((buf) => worker.postMessage({ type, buffer: buf, password }, [buf]));
  });
}

export default function FileEncryption() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [mode, setMode] = useState("encrypt");
  const [files, setFiles] = useState([]);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentName, setCurrentName] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const list = Array.from(e.dataTransfer.files);
    if (list.length) setFiles((prev) => mode === "encrypt" ? [...prev, ...list] : [list[0]]);
  }, [mode]);

  const addPicked = (list) => {
    const arr = Array.from(list);
    setFiles((prev) => mode === "encrypt" ? [...prev, ...arr] : [arr[0]]);
  };

  const removeFile = (i) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const process = async () => {
    if (!files.length) { toast({ title: t("common.nothing"), variant: "destructive" }); return; }
    if (!password) { toast({ title: t("common.passwordRequired"), variant: "destructive" }); return; }
    setLoading(true);
    try {
      const batch = mode === "decrypt" ? files.slice(0, 1) : files;
      for (const f of batch) {
        setCurrentName(f.name);
        setProgress(0);
        if (mode === "encrypt") {
          const out = await runWorker(f, password, "encrypt", setProgress);
          downloadBytes(out, f.name + ".enc");
          addHistory({ section: "File", method: "AES-256-GCM (worker)", mode: "encrypt", bytes: out.length });
        } else {
          const out = await runWorker(f, password, "decrypt", setProgress);
          const name = f.name.replace(/\.enc$/, "") || "decrypted.bin";
          downloadBytes(out, name);
          addHistory({ section: "File", method: "AES-256-GCM (worker)", mode: "decrypt", bytes: out.length });
        }
      }
      toast({ title: mode === "encrypt" ? t("common.encrypted") : t("common.decrypted"), description: `${batch.length} file(s) downloaded.` });
    } catch (e) {
      toast({ title: t("common.operationFailed"), description: e.message, variant: "destructive" });
    } finally {
      setLoading(false); setCurrentName(""); setProgress(0);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader icon={FileKey} title={t("files.title")} subtitle={t("files.subtitle")}>
        <SecurityBadge level="secure" />
      </PageHeader>

      <SecurityNote variant="info">
        Files are processed entirely in your browser inside a Web Worker. The encrypted output (`.enc`) uses a chunked format (magic “ECV1”, salt, per-chunk IVs). Files never leave your device.
      </SecurityNote>

      <div className="mt-6 inline-flex rounded-lg border border-border p-0.5">
        {["encrypt", "decrypt"].map((md) => (
          <button key={md} onClick={() => { setMode(md); setFiles([]); }} className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition ${mode === md ? "bg-emerald-500/15 text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}>{md}</button>
        ))}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn("mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition", dragging ? "border-emerald-500 bg-emerald-500/5" : "border-border hover:border-muted-foreground/50")}
      >
        <input ref={inputRef} type="file" multiple={mode === "encrypt"} className="hidden" onChange={(e) => e.target.files && addPicked(e.target.files)} />
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-medium">{mode === "encrypt" ? "Drop files here or click to browse (batch)" : "Drop an encrypted .enc file or click to browse"}</span>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-xs">
              <span className="flex items-center gap-2 truncate"><FileUp className="h-3.5 w-3.5 text-emerald-400" /> <span className="truncate">{f.name}</span> <span className="text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</span></span>
              <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-rose-400">✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 space-y-2">
        <PasswordInput value={password} onChange={setPassword} />
      </div>

      {loading && (
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="truncate">{currentName}</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.max(3, progress * 100)}%` }} />
          </div>
        </div>
      )}

      <Button onClick={process} disabled={loading} className="mt-5 w-full gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "encrypt" ? <Files className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        {mode === "encrypt" ? `Encrypt & download (${files.length || 0})` : "Decrypt & download"}
      </Button>
    </div>
  );
}