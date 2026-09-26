import { useI18n } from "@/lib/i18n";
import React, { useState, useRef, useCallback } from "react";
import { Image as ImageIcon, Upload, Download, Loader2, Eye, FileText, Type } from "lucide-react";
import PageHeader, { SecurityNote } from "@/components/PageHeader";
import SecurityBadge from "@/components/SecurityBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { embedData, extractData, getImageCapacity, textEmbed, textExtract } from "@/lib/crypto";
import { downloadBytes, downloadText, addHistory } from "@/lib/crypto";
import { cn } from "@/lib/utils";

const MAX_STEGO_FILE_BYTES = 15 * 1024 * 1024;

export default function Steganography() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [surface, setSurface] = useState("image"); // image | text
  const [mode, setMode] = useState("embed");
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [payloadFile, setPayloadFile] = useState(null);
  const [capacity, setCapacity] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [extracted, setExtracted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const imgInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Text/emoji steganography state
  const [cover, setCover] = useState("");
  const [secret, setSecret] = useState("");
  const [carrier, setCarrier] = useState("");
  const [revealed, setRevealed] = useState("");

  const pickImage = (f) => {
    if (f.size > MAX_STEGO_FILE_BYTES && mode === "embed") {
      toast({ title: t("stego.imageTooLarge"), description: t("stego.imageLimit"), variant: "destructive" });
      return;
    }
    setImage(f);
    setCapacity("");
    getImageCapacity(f).then(setCapacity).catch(() => {});
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) pickImage(f);
  }, [mode]);

  const runImage = async () => {
    if (!image) { toast({ title: t("stego.selectPng"), variant: "destructive" }); return; }
    setLoading(true);
    try {
      if (mode === "embed") {
        let payload;
        if (payloadFile) {
          if (payloadFile.size > MAX_STEGO_FILE_BYTES) {
            throw new Error(t("stego.payloadLimit"));
          }
          payload = new Uint8Array(await payloadFile.arrayBuffer());
        }
        else if (message) payload = message;
        else { toast({ title: t("stego.nothingToHide"), variant: "destructive" }); setLoading(false); return; }
        const blob = await embedData(image, payload);
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
        addHistory({ section: "Steganography", method: "LSB", mode: "embed", bytes: blob.size });
        toast({ title: t("stego.hidden"), description: t("stego.downloadPng") });
      } else {
        const bytes = await extractData(image);
        setExtracted(bytes);
        addHistory({ section: "Steganography", method: "LSB", mode: "extract", bytes: bytes.length });
        toast({ title: t("stego.extracted"), description: `${bytes.length} bytes found.` });
      }
    } catch (e) {
      toast({ title: t("stego.failed"), description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const runText = () => {
    try {
      if (mode === "embed") {
        if (!secret) { toast({ title: t("stego.nothingToHide"), variant: "destructive" }); return; }
        const out = textEmbed(cover || "​", secret); // zero-width space fallback if cover empty
        setCarrier(out);
        addHistory({ section: "Steganography", method: "Zero-width", mode: "embed", bytes: secret.length });
        toast({ title: t("stego.messageHidden"), description: t("stego.copyCarrier") });
      } else {
        const msg = textExtract(carrier);
        if (msg == null) { toast({ title: t("stego.noHidden"), variant: "destructive" }); return; }
        setRevealed(msg);
        addHistory({ section: "Steganography", method: "Zero-width", mode: "extract", bytes: msg.length });
        toast({ title: t("stego.messageExtracted") });
      }
    } catch (e) {
      toast({ title: t("stego.failed"), description: e.message, variant: "destructive" });
    }
  };

  const downloadExtracted = () => {
    if (!extracted) return;
    let text;
    try { text = new TextDecoder("utf-8", { fatal: true }).decode(extracted); downloadText(text, "extracted.txt"); }
    catch { downloadBytes(extracted, "extracted.bin"); }
  };

  const copyCarrier = () => {
    navigator.clipboard.writeText(carrier).then(() => toast({ title: t("stego.carrierCopied") }));
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader icon={ImageIcon} title={t("stego.title")} subtitle={t("stego.subtitle")}>
        <SecurityBadge level="educational" />
      </PageHeader>

      <SecurityNote variant="warn">
        Steganography hides data but does not encrypt it. For real secrecy, encrypt the payload first (Text / File sections), then embed it. PNG recommended for images — JPEG compression destroys hidden data.
      </SecurityNote>

      {/* Surface switch */}
      <div className="mt-6 inline-flex rounded-lg border border-border p-0.5">
        {["image", "text"].map((s) => (
          <button
            key={s}
            onClick={() => { setSurface(s); setResultUrl(""); setExtracted(null); setCarrier(""); setRevealed(""); }}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${surface === s ? "bg-amber-500/15 text-amber-400" : "text-muted-foreground hover:text-foreground"}`}
          >
            {s === "image" ? t("stego.imageMode") : t("stego.textMode")}
          </button>
        ))}
      </div>

      {/* Mode switch */}
      <div className="mt-3 inline-flex rounded-lg border border-border p-0.5">
        {["embed", "extract"].map((md) => (
          <button
            key={md}
            onClick={() => { setMode(md); setResultUrl(""); setExtracted(null); setRevealed(""); }}
            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition ${mode === md ? "bg-amber-500/15 text-amber-400" : "text-muted-foreground hover:text-foreground"}`}
          >
            {md === "embed" ? t("stego.hideMode") : t("stego.extractMode")}
          </button>
        ))}
      </div>

      {surface === "image" ? (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => imgInputRef.current?.click()}
            className={cn(
              "mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition",
              dragging ? "border-red-500 bg-red-500/5" : "border-border hover:border-muted-foreground/50"
            )}
          >
            <input ref={imgInputRef} type="file" accept="image/png,image/bmp" className="hidden" onChange={(e) => e.target.files[0] && pickImage(e.target.files[0])} />
            {image ? (
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="h-8 w-8 text-red-400" />
                <span className="text-sm font-medium">{image.name}</span>
                {capacity && <span className="text-xs text-muted-foreground">{t("stego.capacity")}: ~{capacity}</span>}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">{t("stego.imageDrop")}</span>
              </div>
            )}
          </div>

          {mode === "embed" && (
            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("stego.message")}</Label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder={t("stego.messagePh")} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("stego.file")}</Label>
                <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => setPayloadFile(e.target.files[0])} />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  {payloadFile ? payloadFile.name : t("stego.chooseFile")}
                </Button>
              </div>
            </div>
          )}

          <Button onClick={runImage} disabled={loading} className="mt-5 w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            {mode === "embed" ? t("stego.hideImage") : t("stego.extractImage")}
          </Button>

          {resultUrl && (
            <div className="mt-5 space-y-3 rounded-xl border border-border p-4">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("stego.result")}</span>
              <img src={resultUrl} alt="stego" className="max-h-64 rounded-lg border border-border" />
              <a href={resultUrl} download="stego.png" className="inline-flex items-center gap-1.5 rounded-md bg-red-500/15 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/25">
                <Download className="h-4 w-4" /> {t("stego.download")}
              </a>
            </div>
          )}

          {extracted && (
            <div className="mt-5 space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("stego.extractedData")} ({extracted.length} bytes)</span>
                <Button variant="outline" size="sm" onClick={downloadExtracted} className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> {t("common.download")}
                </Button>
              </div>
              <pre className="max-h-48 overflow-auto rounded-lg bg-muted/40 p-3 font-mono text-xs">
                {(() => { try { return new TextDecoder("utf-8", { fatal: true }).decode(extracted); } catch { return t("stego.binaryData"); } })()}
              </pre>
            </div>
          )}
        </>
      ) : (
        <>
          {mode === "embed" ? (
            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("stego.cover")}</Label>
                <Textarea value={cover} onChange={(e) => setCover(e.target.value)} rows={3} placeholder={t("stego.coverPh")} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("stego.secret")}</Label>
                <Textarea value={secret} onChange={(e) => setSecret(e.target.value)} rows={3} placeholder={t("stego.secretPh")} />
              </div>
              <Button onClick={runText} className="w-full gap-2">
                <Type className="h-4 w-4" /> {t("stego.hideText")}
              </Button>
              {carrier && (
                <div className="space-y-2 rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("stego.carrier")}</span>
                    <Button variant="outline" size="sm" onClick={copyCarrier} className="gap-1.5">{t("stego.copy")}</Button>
                  </div>
                  <pre className="max-h-48 min-w-0 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-muted/40 p-3 font-mono text-xs leading-5">{carrier}</pre>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("stego.carrierInput")}</Label>
                <Textarea value={carrier} onChange={(e) => setCarrier(e.target.value)} rows={4} placeholder={t("stego.carrierPh")} />
              </div>
              <Button onClick={runText} className="w-full gap-2">
                <Eye className="h-4 w-4" /> {t("stego.extractText")}
              </Button>
              {revealed && (
                <div className="space-y-2 rounded-xl border border-border p-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("stego.hiddenMessage")}</span>
                  <pre className="max-h-96 min-w-0 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted/40 p-3 font-mono text-sm leading-6">{revealed}</pre>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}