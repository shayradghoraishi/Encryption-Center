import { useI18n } from "@/lib/i18n";
import React, { useState } from "react";
import { KeyRound, Loader2, Signature, Sparkles, ShieldCheck, FileKey, QrCode as QrIcon } from "lucide-react";
import PageHeader, { SecurityNote } from "@/components/PageHeader";
import SecurityBadge from "@/components/SecurityBadge";
import CopyButton from "@/components/CopyButton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  generateRsaKeyPair, generateEcdsaKeyPair, generateEd25519KeyPair,
  ed25519Sign, ed25519Verify, openpgpGenerateKeyPair,
  ed25519SignBytes, ed25519VerifyBytes,
} from "@/lib/crypto";
import QrCanvas from "@/components/QRCode";

export default function KeyManagement() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [keyType, setKeyType] = useState("ed25519");
  const [rsaBits, setRsaBits] = useState(2048);
  const [curve, setCurve] = useState("P-256");
  const [keys, setKeys] = useState(null);
  const [loading, setLoading] = useState(false);

  // Signing
  const [signMsg, setSignMsg] = useState("");
  const [signSec, setSignSec] = useState("");
  const [signature, setSignature] = useState("");
  const [verifyPub, setVerifyPub] = useState("");
  const [verifySig, setVerifySig] = useState("");
  const [verifyMsg, setVerifyMsg] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [showKeyQr, setShowKeyQr] = useState(false);
  // File signing (Ed25519)
  const [signFile, setSignFile] = useState(null);
  const [signFileSec, setSignFileSec] = useState("");
  const [fileSig, setFileSig] = useState("");
  const [verifyFile, setVerifyFile] = useState(null);
  const [verifyFileSig, setVerifyFileSig] = useState("");
  const [verifyFilePub, setVerifyFilePub] = useState("");
  const [verifyFileResult, setVerifyFileResult] = useState(null);

  const signFileNow = async () => {
    try {
      if (!signFile || !signFileSec) throw new Error("File and secret key required");
      const data = new Uint8Array(await signFile.arrayBuffer());
      setFileSig(ed25519SignBytes(data, signFileSec.trim()));
      toast({ title: "File signed" });
    } catch (e) { toast({ title: "Signing failed", description: e.message, variant: "destructive" }); }
  };
  const verifyFileNow = async () => {
    try {
      if (!verifyFile || !verifyFileSig || !verifyFilePub) throw new Error("File, signature and public key required");
      const data = new Uint8Array(await verifyFile.arrayBuffer());
      const ok = ed25519VerifyBytes(data, verifyFileSig.trim(), verifyFilePub.trim());
      setVerifyFileResult(ok);
      toast({ title: ok ? "File signature valid ✓" : "File signature invalid ✗", variant: ok ? "default" : "destructive" });
    } catch (e) { toast({ title: "Verification failed", description: e.message, variant: "destructive" }); }
  };

  const generate = async () => {
    setLoading(true);
    setKeys(null);
    try {
      let result;
      if (keyType === "rsa") result = await generateRsaKeyPair(rsaBits);
      else if (keyType === "ecdsa") result = await generateEcdsaKeyPair(curve);
      else if (keyType === "ed25519") result = generateEd25519KeyPair();
      else if (keyType === "openpgp") result = await openpgpGenerateKeyPair("User", "user@example.com", "");
      setKeys(result);
      toast({ title: `${keyType.toUpperCase()} key pair generated` });
    } catch (e) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const sign = () => {
    try {
      if (!signMsg || !signSec) throw new Error("Message and secret key required");
      setSignature(ed25519Sign(signMsg, signSec.trim()));
      toast({ title: "Signed" });
    } catch (e) {
      toast({ title: "Signing failed", description: e.message, variant: "destructive" });
    }
  };

  const verify = () => {
    try {
      const ok = ed25519Verify(verifyMsg, verifySig.trim(), verifyPub.trim());
      setVerifyResult(ok);
      toast({ title: ok ? "Signature valid ✓" : "Signature invalid ✗", variant: ok ? "default" : "destructive" });
    } catch (e) {
      toast({ title: "Verification failed", description: e.message, variant: "destructive" });
    }
  };

  const KeyBlock = ({ label, value }) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>
        <CopyButton value={value} />
      </div>
      <Textarea value={value} readOnly rows={6} className="font-mono text-[11px]" />
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader icon={KeyRound} title={t("keys.title")} subtitle={t("keys.subtitle")}>
        <SecurityBadge level="secure" />
      </PageHeader>

      <SecurityNote variant="warn">
        Private keys are generated and shown locally. Store them securely — anyone with your private key can impersonate you. Never share a private key.
      </SecurityNote>

      {/* Key generation */}
      <div className="mt-6 rounded-xl border border-border p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-emerald-400" /> Generate Key Pair
        </h3>
        <div className="flex flex-wrap gap-2">
          {["ed25519", "ecdsa", "rsa", "openpgp"].map((t) => (
            <button
              key={t}
              onClick={() => setKeyType(t)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium uppercase transition ${keyType === t ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {keyType === "rsa" && (
          <div className="mt-3 flex gap-2">
            {[2048, 3072, 4096].map((b) => (
              <button key={b} onClick={() => setRsaBits(b)} className={`rounded-md border px-3 py-1 text-xs ${rsaBits === b ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-border"}`}>{b} bits</button>
            ))}
          </div>
        )}
        {keyType === "ecdsa" && (
          <div className="mt-3 flex gap-2">
            {["P-256", "P-384", "P-521"].map((c) => (
              <button key={c} onClick={() => setCurve(c)} className={`rounded-md border px-3 py-1 text-xs ${curve === c ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-border"}`}>{c}</button>
            ))}
          </div>
        )}

        <Button onClick={generate} disabled={loading} className="mt-4 gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Generate {keyType.toUpperCase()} key pair
        </Button>

        {keys && (
          <div className="mt-5 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <KeyBlock label="Public Key" value={keys.publicKey || keys.publicKey} />
              <KeyBlock label="Private / Secret Key" value={keys.privateKey || keys.secretKey} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowKeyQr((s) => !s)} className="gap-1.5">
                <QrIcon className="h-3.5 w-3.5" /> {showKeyQr ? "Hide public key QR" : "Show public key QR"}
              </Button>
              {showKeyQr && <QrCanvas value={keys.publicKey || keys.publicKey} size={180} className="rounded-lg border border-border bg-white p-1" />}
            </div>
          </div>
        )}
      </div>

      {/* Sign & verify */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Signature className="h-4 w-4 text-emerald-400" /> Sign (Ed25519)
          </h3>
          <div className="space-y-3">
            <Textarea value={signMsg} onChange={(e) => setSignMsg(e.target.value)} placeholder="Message to sign…" rows={3} />
            <Textarea value={signSec} onChange={(e) => setSignSec(e.target.value)} placeholder="Ed25519 secret key (base64)" rows={2} className="font-mono text-xs" />
            <Button onClick={sign} size="sm" className="gap-1.5"><Signature className="h-3.5 w-3.5" /> Sign</Button>
            {signature && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] uppercase text-muted-foreground">Signature</Label>
                  <CopyButton value={signature} />
                </div>
                <Textarea value={signature} readOnly rows={3} className="font-mono text-[11px]" />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Verify (Ed25519)
          </h3>
          <div className="space-y-3">
            <Textarea value={verifyMsg} onChange={(e) => setVerifyMsg(e.target.value)} placeholder="Original message…" rows={2} />
            <Textarea value={verifySig} onChange={(e) => setVerifySig(e.target.value)} placeholder="Signature (base64)" rows={2} className="font-mono text-xs" />
            <Textarea value={verifyPub} onChange={(e) => setVerifyPub(e.target.value)} placeholder="Public key (base64)" rows={2} className="font-mono text-xs" />
            <Button onClick={verify} size="sm" variant="outline" className="gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Verify</Button>
            {verifyResult !== null && (
              <div className={`rounded-lg border px-3 py-2 text-sm font-medium ${verifyResult ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-rose-500/40 bg-rose-500/10 text-rose-400"}`}>
                {verifyResult ? "Signature is valid ✓" : "Signature is invalid ✗"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sign & verify files (Ed25519) */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <FileKey className="h-4 w-4 text-emerald-400" /> Sign a File (Ed25519)
          </h3>
          <div className="space-y-3">
            <input type="file" onChange={(e) => setSignFile(e.target.files[0])} className="block w-full text-xs file:mr-2 file:rounded file:border file:border-border file:px-2 file:py-1" />
            <Textarea value={signFileSec} onChange={(e) => setSignFileSec(e.target.value)} placeholder="Ed25519 secret key (base64)" rows={2} className="font-mono text-xs" />
            <Button onClick={signFileNow} size="sm" className="gap-1.5"><Signature className="h-3.5 w-3.5" /> Sign file</Button>
            {fileSig && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] uppercase text-muted-foreground">Signature</Label>
                  <CopyButton value={fileSig} />
                </div>
                <Textarea value={fileSig} readOnly rows={3} className="font-mono text-[11px]" />
              </div>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-border p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Verify a File (Ed25519)
          </h3>
          <div className="space-y-3">
            <input type="file" onChange={(e) => setVerifyFile(e.target.files[0])} className="block w-full text-xs file:mr-2 file:rounded file:border file:border-border file:px-2 file:py-1" />
            <Textarea value={verifyFileSig} onChange={(e) => setVerifyFileSig(e.target.value)} placeholder="Signature (base64)" rows={2} className="font-mono text-xs" />
            <Textarea value={verifyFilePub} onChange={(e) => setVerifyFilePub(e.target.value)} placeholder="Public key (base64)" rows={2} className="font-mono text-xs" />
            <Button onClick={verifyFileNow} size="sm" variant="outline" className="gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Verify file</Button>
            {verifyFileResult !== null && (
              <div className={`rounded-lg border px-3 py-2 text-sm font-medium ${verifyFileResult ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-rose-500/40 bg-rose-500/10 text-rose-400"}`}>
                {verifyFileResult ? "File signature is valid ✓" : "File signature is invalid ✗"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}