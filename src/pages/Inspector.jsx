import React, { useState } from "react";
import { ScanSearch, FileCheck2, AlertTriangle } from "lucide-react";
import PageHeader, { SecurityNote } from "@/components/PageHeader";
import SecurityBadge from "@/components/SecurityBadge";
import { useI18n } from "@/lib/i18n";
import { inspectEcv2, detectFormat } from "@/lib/crypto/inspect";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Inspector() {
  const { t } = useI18n(); const [result, setResult] = useState(null); const [error, setError] = useState(""); const [file, setFile] = useState(null); const [detected, setDetected] = useState("—");
  const inspect = async () => { if (!file) return; setError(""); setResult(null); setDetected("—"); try { const bytes = new Uint8Array(await file.arrayBuffer()); setDetected(detectFormat(bytes)); setResult(inspectEcv2(bytes)); } catch(e) { setError(e.message); } };
  return <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
    <PageHeader icon={ScanSearch} title={t("inspector.title")} subtitle={t("inspector.subtitle")}><SecurityBadge level="secure"/></PageHeader>
    <SecurityNote variant="info">{t("inspector.note")}</SecurityNote>
    <div className="mt-6 rounded-2xl border border-border p-5"><input type="file" onChange={e=>setFile(e.target.files?.[0] || null)} className="block w-full text-sm"/><div className="mt-4 flex flex-wrap items-center gap-3"><Button onClick={inspect} disabled={!file} className="gap-2"><ScanSearch className="h-4 w-4"/>{t("inspector.inspect")}</Button>{file && <span className="text-xs text-muted-foreground">{t("inspector.detected")}: {detected}</span>}</div></div>
    {error && <div className="mt-5 flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm"><AlertTriangle className="h-5 w-5 shrink-0 text-amber-400"/><span>{error}</span></div>}
    {result && <div className="mt-5 space-y-4"><div className={cn("rounded-xl border p-4", result.validStructure ? "border-green-500/30 bg-green-500/5" : "border-rose-500/30") }><div className="flex items-center gap-2 font-semibold"><FileCheck2 className="h-5 w-5 text-green-400"/>ECV2 {t("inspector.title")} {result.validStructure ? t("inspector.valid") : t("inspector.invalid")}</div></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[["Format",result.format],["Algorithm",result.algorithm],["KDF",result.kdf],["Plaintext size",`${result.plaintextBytes.toLocaleString()} bytes`],["Chunks",result.chunkCount],["Total bytes",result.byteLength.toLocaleString()],["Overhead",`${result.overheadBytes.toLocaleString()} bytes`],["Chunk size",`${result.chunkSize.toLocaleString()} bytes`],["Salt preview",result.saltPreview]].map(([k,v])=><div key={k} className="rounded-xl border border-border bg-card/30 p-4"><div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</div><div className="mt-1 break-all font-mono text-sm">{v}</div></div>)}</div>
      <div className="rounded-xl border border-border p-5"><h3 className="mb-3 font-semibold">{t("inspector.chunks")}</h3><div className="space-y-2 text-xs">{result.chunks.map(c=><div key={c.index} className="grid grid-cols-[auto_1fr_auto] gap-3 rounded-lg bg-muted/30 p-2"><span>#{c.index+1}</span><span className="font-mono truncate">IV {c.iv}</span><span>{c.ciphertextBytes.toLocaleString()} B · ✓</span></div>)}{result.moreChunks && <p className="pt-2 text-muted-foreground">{t("inspector.first50")}</p>}</div></div>
    </div>}
  </div>;
}
