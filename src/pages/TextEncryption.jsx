import React, { useState } from "react";
import { Lock, ArrowRightLeft, Sparkles, Loader2, Plus, X, Layers, QrCode as QrIcon } from "lucide-react";
import PageHeader, { SecurityNote } from "@/components/PageHeader";
import IOField from "@/components/IOField";
import PasswordInput from "@/components/PasswordInput";
import SecurityBadge from "@/components/SecurityBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useI18n } from "@/lib/i18n";
import { useAdvancedMode } from "@/lib/advanced-mode";
import {
  aesEncrypt, aesDecrypt, chachaEncrypt, chachaDecrypt,
  ageEncrypt, ageDecrypt, generateAgeKeyPair,
  openpgpEncrypt, openpgpDecrypt,
  bytesToBase64, base64ToBytes, addHistory,
  cascadeEncrypt, cascadeDecrypt,
} from "@/lib/crypto";
import QrCanvas from "@/components/QRCode";
import QrScanner from "@/components/QrScanner";

const METHODS = {
  aes: { name: "AES-256-GCM", badge: "secure", desc: "Authenticated encryption via Web Crypto. PBKDF2 key derivation (250k iterations). Industry standard.", auth: "password" },
  chacha: { name: "ChaCha20-Poly1305", badge: "secure", desc: "Modern AEAD stream cipher. Argon2id key derivation. Excellent on mobile / no hardware AES.", auth: "password" },
  age: { name: "Age-style (X25519 + ChaCha20)", badge: "secure", desc: "Public-key encryption using ephemeral X25519 and ChaCha20-Poly1305.", auth: "key" },
  openpgp: { name: "OpenPGP (symmetric)", badge: "secure", desc: "OpenPGP.js hybrid encryption to a passphrase. AES-256. Interoperable with GnuPG.", auth: "password", advanced: true },
  cascade: { name: "Cascade", badge: "secure", desc: "Multi-layer encryption (Advanced Mode). Each layer is AES-256-GCM or ChaCha20-Poly1305 with its own password.", auth: "layers", advanced: true },
};

export default function TextEncryption() {
  const { toast } = useToast();
  const { t } = useI18n();
  const { advanced } = useAdvancedMode();
  const [method, setMethod] = useState(() => localStorage.getItem("enc-default-method") || "aes");
  const [mode, setMode] = useState("encrypt");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [password, setPassword] = useState("");
  const [agePub, setAgePub] = useState("");
  const [ageSec, setAgeSec] = useState("");
  const [layers, setLayers] = useState([{ kind: "aes", password: "" }]);
  const [loading, setLoading] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [codeLang, setCodeLang] = useState("text");
  const CODE_LANGS = [
    { id: "text", label: "Plain text" },
    { id: "javascript", label: "JavaScript" },
    { id: "python", label: "Python" },
    { id: "java", label: "Java" },
    { id: "cpp", label: "C / C++" },
    { id: "go", label: "Go" },
    { id: "rust", label: "Rust" },
    { id: "php", label: "PHP" },
    { id: "ruby", label: "Ruby" },
    { id: "sql", label: "SQL" },
    { id: "html", label: "HTML / CSS" },
    { id: "other", label: "Other" },
  ];

  const m = METHODS[method];
  const visibleMethods = Object.entries(METHODS).filter(([, v]) => !v.advanced || advanced);
  React.useEffect(() => { if (METHODS[method]?.advanced && !advanced) setMethod("aes"); }, [advanced, method]);

  const run = async () => {
    if (!input.trim()) { toast({ title: t("common.nothing"), description: t("common.enterText"), variant: "destructive" }); return; }
    setLoading(true); setOutput("");
    try {
      let result = "";
      if (method === "aes") {
        if (!password) throw new Error("Password required");
        if (mode === "encrypt") { const bytes = await aesEncrypt(input, password); result = bytesToBase64(bytes); }
        else result = await aesDecrypt(base64ToBytes(input.trim()), password);
      } else if (method === "chacha") {
        if (!password) throw new Error("Password required");
        if (mode === "encrypt") { const bytes = await chachaEncrypt(input, password); result = bytesToBase64(bytes); }
        else result = await chachaDecrypt(base64ToBytes(input.trim()), password);
      } else if (method === "age") {
        if (mode === "encrypt") { if (!agePub) throw new Error("Recipient public key required"); const bytes = await ageEncrypt(input, agePub.trim()); result = bytesToBase64(bytes); }
        else { if (!ageSec) throw new Error("Secret key required to decrypt"); result = await ageDecrypt(base64ToBytes(input.trim()), ageSec.trim()); }
      } else if (method === "openpgp") {
        if (!password) throw new Error("Password required");
        if (mode === "encrypt") result = await openpgpEncrypt(input, password);
        else result = await openpgpDecrypt(input.trim(), password);
      } else if (method === "cascade") {
        if (mode === "encrypt") { const bytes = await cascadeEncrypt(input, layers); result = bytesToBase64(bytes); }
        else result = await cascadeDecrypt(base64ToBytes(input.trim()), layers);
      }
      setOutput(result);
      addHistory({ section: "Text", method: m.name, mode, bytes: result.length });
      toast({ title: mode === "encrypt" ? t("common.encrypted") : t("common.decrypted"), description: m.name });
    } catch (e) {
      toast({ title: t("common.operationFailed"), description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const genAgeKey = () => {
    const kp = generateAgeKeyPair();
    setAgePub(kp.publicKeyB64); setAgeSec(kp.secretKeyB64);
    toast({ title: t("common.generatePair"), description: t("text.ageWarning") });
  };

  const addLayer = () => setLayers((l) => [...l, { kind: "aes", password: "" }]);
  const removeLayer = (i) => setLayers((l) => l.filter((_, idx) => idx !== i));
  const setLayer = (i, patch) => setLayers((l) => l.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader icon={Lock} title={t("text.title")} subtitle={t("text.subtitle")}>
        <SecurityBadge level={m.badge} />
      </PageHeader>

      <SecurityNote variant="info">
        {t("text.note")}
      </SecurityNote>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {visibleMethods.map(([key, val]) => (
          <button key={key} onClick={() => { setMethod(key); setOutput(""); }} className={`rounded-lg border p-3 text-left transition ${method === key ? "border-red-500/50 bg-red-500/5" : "border-border hover:border-muted-foreground/40"}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{val.name}</span>
              {val.advanced && <Layers className="h-3 w-3 text-amber-400" />}
            </div>
            <SecurityBadge level={val.badge} className="mt-1.5" />
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">{m.desc}</p>

      <div className="mt-5 inline-flex rounded-lg border border-border p-0.5">
        {["encrypt", "decrypt"].map((md) => (
          <button key={md} onClick={() => { setMode(md); setOutput(""); }} className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition ${mode === md ? "bg-red-500/15 text-red-400" : "text-muted-foreground hover:text-foreground"}`}>{md === "encrypt" ? t("common.encrypt") : t("common.decrypt")}</button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("common.codeLang")}</Label>
        <select
          value={codeLang}
          onChange={(e) => setCodeLang(e.target.value)}
          className="rounded-md border border-border bg-transparent px-2 py-1.5 text-xs"
        >
          {CODE_LANGS.map((l) => (
            <option key={l.id} value={l.id} className="bg-card">{l.label}</option>
          ))}
        </select>
        <span className="text-[11px] text-muted-foreground">{t("common.codeLangHint")}</span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <IOField
            label={mode === "encrypt" ? t("text.plaintext") : t("text.ciphertext")}
            value={input} onChange={setInput}
            placeholder={mode === "encrypt" ? (t("text.plaintext") + "…") : (t("text.ciphertext") + "…")}
            rows={7}
            downloadName={mode === "encrypt" ? `plaintext.${codeLang === "text" ? "txt" : codeLang}` : "ciphertext.txt"}
          />
          {mode === "decrypt" && <QrScanner onScan={setInput} label={t("common.scanQr")} />}

          {m.auth === "password" && (
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("common.password")}</Label>
              <PasswordInput value={password} onChange={setPassword} />
            </div>
          )}

          {m.auth === "key" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("text.ageStyle")}</Label>
                <Button size="sm" variant="outline" onClick={genAgeKey} className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> {t("common.generatePair")}</Button>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">{t("common.recipientPub")}</Label>
                <Textarea value={agePub} onChange={(e) => setAgePub(e.target.value)} rows={2} className="font-mono text-xs" placeholder={t("common.x25519PublicPh")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">{t("common.yourSecret")}</Label>
                <Textarea value={ageSec} onChange={(e) => setAgeSec(e.target.value)} rows={2} className="font-mono text-xs" placeholder={t("common.x25519SecretPh")} />
              </div>
            </div>
          )}

          {m.auth === "layers" && (
            <div className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("common.layersLabel")}</Label>
                <Button size="sm" variant="outline" onClick={addLayer} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> {t("common.addLayer")}</Button>
              </div>
              {layers.map((l, i) => (
                <div key={i} className="space-y-1.5 rounded-lg bg-muted/30 p-2.5">
                  <div className="flex items-center gap-2">
                    <select value={l.kind} onChange={(e) => setLayer(i, { kind: e.target.value })} className="rounded-md border border-border bg-transparent px-2 py-1 text-xs">
                      <option value="aes">AES-256-GCM</option>
                      <option value="chacha">ChaCha20-Poly1305</option>
                    </select>
                    <span className="text-xs text-muted-foreground">{t("common.layer")} {i + 1}</span>
                    {layers.length > 1 && <button onClick={() => removeLayer(i)} className="ml-auto text-muted-foreground hover:text-rose-400"><X className="h-3.5 w-3.5" /></button>}
                  </div>
                  <PasswordInput value={l.password} onChange={(v) => setLayer(i, { password: v })} placeholder={`${t("common.password")} ${t("common.layer")} ${i + 1}`} />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">{t("common.layersHint")}</p>
            </div>
          )}

          <Button onClick={run} disabled={loading} className="w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
            {mode === "encrypt" ? t("common.encrypt") : t("common.decrypt")}
          </Button>
        </div>

        <div className="space-y-3">
          <IOField
            label={mode === "encrypt" ? t("text.ciphertext") : t("common.decryptedText")}
            value={output} readOnly
            placeholder={t("common.resultPh")}
            rows={12}
            downloadName={mode === "encrypt" ? "ciphertext.txt" : `decrypted.${codeLang === "text" ? "txt" : codeLang}`}
          />
          {output && (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowQr((s) => !s)} className="gap-1.5">
                <QrIcon className="h-3.5 w-3.5" /> {showQr ? t("common.hideQr") : t("common.showQr")}
              </Button>
              {showQr && output.length <= 1200 && <QrCanvas value={output} size={180} className="rounded-lg border border-border bg-white p-1" />}
              {showQr && output.length > 1200 && <span className="text-xs text-muted-foreground">{t("common.qrTooLarge")}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}