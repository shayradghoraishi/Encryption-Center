import React, { useState } from "react";
import { FileSignature, ShieldCheck, FileKey, Download } from "lucide-react";
import PageHeader, { SecurityNote } from "@/components/PageHeader";
import SecurityBadge from "@/components/SecurityBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import CopyButton from "@/components/CopyButton";
import { ed25519Sign, ed25519Verify, ed25519SignBytes, ed25519VerifyBytes, generateEd25519KeyPair } from "@/lib/crypto/keys";
import { downloadText, addHistory } from "@/lib/crypto";
import { useI18n } from "@/lib/i18n";

export default function Signatures() {
  const { t } = useI18n();
  const [message, setMessage] = useState("");
  const [secret, setSecret] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [signature, setSignature] = useState("");
  const [valid, setValid] = useState(null);
  const [file, setFile] = useState(null);
  const [fileSig, setFileSig] = useState("");
  const [verifyFile, setVerifyFile] = useState(null);
  const [verifySig, setVerifySig] = useState("");
  const [verifyPub, setVerifyPub] = useState("");

  const makeKeys = () => { const k = generateEd25519KeyPair(); setPublicKey(k.publicKey); setSecret(k.secretKey); };
  const sign = () => { if (!message || !secret) return; setSignature(ed25519Sign(message, secret)); setValid(null); addHistory({ section: "Signatures", method: "Ed25519", mode: "sign" }); };
  const verify = () => { if (!message || !signature || !publicKey) return; setValid(ed25519Verify(message, signature, publicKey)); addHistory({ section: "Signatures", method: "Ed25519", mode: "verify" }); };
  const signFileNow = async () => { if (!file || !secret) return; setFileSig(ed25519SignBytes(new Uint8Array(await file.arrayBuffer()), secret)); addHistory({ section: "Signatures", method: "Ed25519", mode: "sign-file", bytes: file.size }); };
  const verifyFileNow = async () => { if (!verifyFile || !verifySig || !verifyPub) return; setValid(ed25519VerifyBytes(new Uint8Array(await verifyFile.arrayBuffer()), verifySig, verifyPub)); };

  return <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
    <PageHeader icon={FileSignature} title={t("signatures.title")} subtitle={t("signatures.subtitle")}><SecurityBadge level="secure" /></PageHeader>
    <SecurityNote variant="info">{t("signatures.note")}</SecurityNote>
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card/40 p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">{t("signatures.textTitle")}</h2><Button variant="outline" size="sm" onClick={makeKeys}>{t("signatures.generateKeys")}</Button></div>
        <div className="space-y-3"><Label>{t("signatures.message")}</Label><Textarea value={message} onChange={e=>setMessage(e.target.value)} rows={5} placeholder={t("signatures.messagePh")} />
          <Label>{t("signatures.secret")}</Label><Textarea value={secret} onChange={e=>setSecret(e.target.value)} rows={3} className="font-mono text-xs" placeholder={t("signatures.secretPh")} />
          <Label>{t("signatures.public")}</Label><Textarea value={publicKey} onChange={e=>setPublicKey(e.target.value)} rows={2} className="font-mono text-xs" placeholder={t("signatures.publicPh")} />
          <div className="flex flex-wrap gap-2"><Button onClick={sign}>{t("signatures.sign")}</Button><Button variant="outline" onClick={verify}>{t("signatures.verify")}</Button></div>
          {signature && <div><div className="mb-1 flex justify-between"><Label>{t("signatures.signature")}</Label><CopyButton value={signature}/></div><Textarea value={signature} onChange={e=>setSignature(e.target.value)} rows={3} className="font-mono text-xs" /></div>}
          {valid !== null && <div className={`rounded-lg border p-3 text-sm ${valid ? "border-red-500/40 bg-red-500/10 text-red-400" : "border-rose-500/40 bg-rose-500/10 text-rose-400"}`}>{valid ? t("signatures.valid") : t("signatures.invalid")}</div>}
        </div>
      </section>
      <section className="rounded-2xl border border-border bg-card/40 p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">{t("signatures.fileTitle")}</h2>
        <div className="space-y-3"><Label>{t("signatures.file")}</Label><input type="file" onChange={e=>setFile(e.target.files?.[0] || null)} className="block w-full text-xs"/><Button onClick={signFileNow} disabled={!file || !secret} className="gap-2"><FileKey className="h-4 w-4"/>{t("signatures.signFile")}</Button>
          {fileSig && <><div className="flex justify-between"><Label>{t("signatures.fileSignature")}</Label><CopyButton value={fileSig}/></div><Textarea value={fileSig} readOnly rows={3} className="font-mono text-xs"/><Button variant="outline" size="sm" onClick={()=>downloadText(fileSig, `${file.name}.sig`)} className="gap-2"><Download className="h-4 w-4"/>{t("signatures.downloadSig")}</Button></>}
          <div className="my-5 border-t border-border"/><Label>{t("signatures.verifyFile")}</Label><input type="file" onChange={e=>setVerifyFile(e.target.files?.[0] || null)} className="block w-full text-xs"/><Textarea value={verifySig} onChange={e=>setVerifySig(e.target.value)} rows={3} className="font-mono text-xs" placeholder={t("signatures.sigPh")}/><Textarea value={verifyPub} onChange={e=>setVerifyPub(e.target.value)} rows={2} className="font-mono text-xs" placeholder={t("signatures.pubPh")}/><Button variant="outline" onClick={verifyFileNow} disabled={!verifyFile}>Verify file</Button></div>
      </section>
    </div>
    <div className="mt-5 rounded-2xl border border-border p-5"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-red-400"/><div><h3 className="font-semibold">{t("signatures.why")}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{t("signatures.whyText")}</p></div></div></div>
  </div>;
}
