import React, { useCallback, useEffect, useState } from "react";
import { Hash, CheckCircle2 } from "lucide-react";
import PageHeader, { SecurityNote } from "@/components/PageHeader";
import SecurityBadge from "@/components/SecurityBadge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import CopyButton from "@/components/CopyButton";
import { useI18n } from "@/lib/i18n";
import { addHistory } from "@/lib/crypto";

const ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512", "SHA-3-256", "SHA-3-512", "BLAKE2b-512", "BLAKE3-256"];

async function hashBytes(data, algo) {
  if (algo.startsWith("SHA-3") || algo.startsWith("BLAKE")) {
    const { sha3, blake2b, blake3 } = await import("hash-wasm");
    if (algo === "SHA-3-256") return sha3(data, 256);
    if (algo === "SHA-3-512") return sha3(data, 512);
    if (algo === "BLAKE2b-512") return blake2b(data, 512);
    return blake3(data, 256);
  }
  return hex(new Uint8Array(await crypto.subtle.digest(algo, data)));
}

function hex(bytes) { return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join(""); }

export default function HashCalculator() {
  const { t } = useI18n();
  const [input, setInput] = useState(""); const [algo, setAlgo] = useState("SHA-256"); const [hmacKey, setHmacKey] = useState(""); const [out, setOut] = useState(""); const [loading, setLoading] = useState(false); const [file, setFile] = useState(null); const [fileMode, setFileMode] = useState(false); const [verify, setVerify] = useState(""); const [match, setMatch] = useState(null);
  const run = useCallback(async () => { setLoading(true); setMatch(null); try { const data = fileMode && file ? new Uint8Array(await file.arrayBuffer()) : new TextEncoder().encode(input); let buf; if (hmacKey && !fileMode && !algo.startsWith("SHA-3") && !algo.startsWith("BLAKE")) { const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(hmacKey), { name: "HMAC", hash: algo }, false, ["sign"]); buf = new Uint8Array(await crypto.subtle.sign("HMAC", key, data)); } else { if (hmacKey) throw new Error("HMAC is currently available for SHA-1/SHA-2 algorithms only."); buf = await hashBytes(data, algo); } const result = typeof buf === "string" ? buf : hex(buf); setOut(result); addHistory({ section: "Hash", method: hmacKey ? `HMAC-${algo}` : algo, mode: fileMode ? "file" : "text", bytes: data.length }); } catch(e){setOut(`Error: ${e.message}`);} finally{setLoading(false);} }, [input, algo, hmacKey, file, fileMode]);
  useEffect(()=>{ if(!fileMode) run(); },[input,algo,hmacKey,fileMode]);
  const verifyDigest=()=>{ if(!verify) return; setMatch(verify.trim().toLowerCase()===out.toLowerCase()); };
  return <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10"><PageHeader icon={Hash} title={t("hc.title")} subtitle={t("hc.subtitle")}><SecurityBadge level="secure"/></PageHeader>
    <div className="mb-5 inline-flex rounded-lg border border-border p-0.5"><button onClick={()=>setFileMode(false)} className={`rounded-md px-4 py-1.5 text-sm ${!fileMode?"bg-red-500/15 text-red-400":"text-muted-foreground"}`}>{t("hc.text")}</button><button onClick={()=>setFileMode(true)} className={`rounded-md px-4 py-1.5 text-sm ${fileMode?"bg-red-500/15 text-red-400":"text-muted-foreground"}`}>{t("hc.file")}</button></div>
    <div className="flex flex-wrap gap-2">{ALGOS.map(a=><button key={a} onClick={()=>setAlgo(a)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${algo===a?"border-red-500/50 bg-red-500/10 text-red-400":"border-border text-muted-foreground hover:text-foreground"}`}>{a}</button>)}</div>
    <div className="mt-5 space-y-4 rounded-2xl border border-border p-5">{fileMode?<div className="space-y-2"><Label>{t("hc.selectFile")}</Label><input type="file" onChange={e=>setFile(e.target.files?.[0]||null)} className="block w-full text-xs"/></div>:<div className="space-y-2"><Label>{t("hc.input")}</Label><Textarea value={input} onChange={e=>setInput(e.target.value)} rows={6} placeholder={t("hc.inputPh")}/></div>}
      {!fileMode && !algo.startsWith("SHA-3") && !algo.startsWith("BLAKE") && <div className="space-y-2"><Label>{t("hc.hmacKey")}</Label><Input value={hmacKey} onChange={e=>setHmacKey(e.target.value)} placeholder={t("hc.hmacPh")}/></div>}
      {fileMode && <button onClick={run} disabled={!file||loading} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{t("hc.calculateFile")}</button>}
      <div className="space-y-2"><div className="flex items-center justify-between"><Label>{t("hc.output")}</Label><CopyButton value={out} label={t("hc.copy")}/></div><pre className="max-h-48 overflow-auto rounded-xl bg-muted/40 p-4 font-mono text-xs break-all whitespace-pre-wrap">{loading?"Processing…":out||"—"}</pre></div>
      <div className="space-y-2"><Label>{t("hc.compare")}</Label><div className="flex gap-2"><Input value={verify} onChange={e=>setVerify(e.target.value)} placeholder={t("hc.expected")}/><button onClick={verifyDigest} disabled={!out} className="rounded-lg border border-border px-4 text-sm">{t("hc.verify")}</button></div>{match!==null&&<div className={`flex items-center gap-2 text-sm ${match?"text-green-400":"text-rose-400"}`}><CheckCircle2 className="h-4 w-4"/>{match ? t("hc.matches") : t("hc.noMatch")}</div>}</div>
    </div><SecurityNote variant="info">{t("hc.note")}</SecurityNote></div>;
}
