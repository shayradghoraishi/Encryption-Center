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
    setImage(f);
    setCapacity("");
    getImageCapacity(f).then(setCapacity).catch(() => {});
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) pickImage(f);
  }, []);

  const runImage = async () => {
    if (!image) { toast({ title: "Select a PNG image first", variant: "destructive" }); return; }
    setLoading(true);
    try {
      if (mode === "embed") {
        let payload;
        if (payloadFile) payload = new Uint8Array(await payloadFile.arrayBuffer());
        else if (message) payload = message;
        else { toast({ title: "Nothing to hide", variant: "destructive" }); setLoading(false); return; }
        const blob = await embedData(image, payload);
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
        addHistory({ section: "Steganography", method: "LSB", mode: "embed", bytes: blob.size });
        toast({ title: "Data hidden in image", description: "Download the PNG to share." });
      } else {
        const bytes = await extractData(image);
        setExtracted(bytes);
        addHistory({ section: "Steganography", method: "LSB", mode: "extract", bytes: bytes.length });
        toast({ title: "Data extracted", description: `${bytes.length} bytes found.` });
      }
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const runText = () => {
    try {
      if (mode === "embed") {
        if (!secret) { toast({ title: "Nothing to hide", variant: "destructive" }); return; }
        const out = textEmbed(cover || "​", secret); // zero-width space fallback if cover empty
        setCarrier(out);
        addHistory({ section: "Steganography", method: "Zero-width", mode: "embed", bytes: secret.length });
        toast({ title: "Message hidden in text", description: "Copy the carrier text to share." });
      } else {
        const msg = textExtract(carrier);
        if (msg == null) { toast({ title: "No hidden message found", variant: "destructive" }); return; }
        setRevealed(msg);
        addHistory({ section: "Steganography", method: "Zero-width", mode: "extract", bytes: msg.length });
        toast({ title: "Message extracted" });
      }
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const downloadExtracted = () => {
    if (!extracted) return;
    let text;
    try { text = new TextDecoder("utf-8", { fatal: true }).decode(extracted); downloadText(text, "extracted.txt"); }
    catch { downloadBytes(extracted, "extracted.bin"); }
  };

  const copyCarrier = () => {
    navigator.clipboard.writeText(carrier).then(() => toast({ title: "Carrier text copied" }));
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
            {s === "image" ? "Image (LSB)" : "Text / Emoji"}
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
            {md === "embed" ? "Hide data" : "Extract data"}
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
              dragging ? "border-emerald-500 bg-emerald-500/5" : "border-border hover:border-muted-foreground/50"
            )}
          >
            <input ref={imgInputRef} type="file" accept="image/png,image/bmp" className="hidden" onChange={(e) => e.target.files[0] && pickImage(e.target.files[0])} />
            {image ? (
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="h-8 w-8 text-emerald-400" />
                <span className="text-sm font-medium">{image.name}</span>
                {capacity && <span className="text-xs text-muted-foreground">Capacity: ~{capacity}</span>}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">Drop a PNG image or click to browse</span>
              </div>
            )}
          </div>

          {mode === "embed" && (
            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Message to hide</Label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Secret message…" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">…or hide a file</Label>
                <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => setPayloadFile(e.target.files[0])} />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  {payloadFile ? payloadFile.name : "Choose file"}
                </Button>
              </div>
            </div>
          )}

          <Button onClick={runImage} disabled={loading} className="mt-5 w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            {mode === "embed" ? "Hide data in image" : "Extract hidden data"}
          </Button>

          {resultUrl && (
            <div className="mt-5 space-y-3 rounded-xl border border-border p-4">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Result image</span>
              <img src={resultUrl} alt="stego" className="max-h-64 rounded-lg border border-border" />
              <a href={resultUrl} download="stego.png" className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-3 py-1.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/25">
                <Download className="h-4 w-4" /> Download stego image
              </a>
            </div>
          )}

          {extracted && (
            <div className="mt-5 space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Extracted data ({extracted.length} bytes)</span>
                <Button variant="outline" size="sm" onClick={downloadExtracted} className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
              </div>
              <pre className="max-h-48 overflow-auto rounded-lg bg-muted/40 p-3 font-mono text-xs">
                {(() => { try { return new TextDecoder("utf-8", { fatal: true }).decode(extracted); } catch { return "(binary data — download to view)"; } })()}
              </pre>
            </div>
          )}
        </>
      ) : (
        <>
          {mode === "embed" ? (
            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cover text / emojis (visible)</Label>
                <Textarea value={cover} onChange={(e) => setCover(e.target.value)} rows={3} placeholder="Paste any text or emojis here, e.g. 🦊🌈✨" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Secret message to hide</Label>
                <Textarea value={secret} onChange={(e) => setSecret(e.target.value)} rows={3} placeholder="The hidden message…" />
              </div>
              <Button onClick={runText} className="w-full gap-2">
                <Type className="h-4 w-4" /> Hide message in text
              </Button>
              {carrier && (
                <div className="space-y-2 rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Carrier text (copy & share)</span>
                    <Button variant="outline" size="sm" onClick={copyCarrier} className="gap-1.5">Copy</Button>
                  </div>
                  <pre className="max-h-32 overflow-auto break-words rounded-lg bg-muted/40 p-3 font-mono text-xs">{carrier}</pre>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Carrier text containing hidden message</Label>
                <Textarea value={carrier} onChange={(e) => setCarrier(e.target.value)} rows={4} placeholder="Paste the text that contains the hidden message…" />
              </div>
              <Button onClick={runText} className="w-full gap-2">
                <Eye className="h-4 w-4" /> Extract hidden message
              </Button>
              {revealed && (
                <div className="space-y-2 rounded-xl border border-border p-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hidden message</span>
                  <pre className="break-words rounded-lg bg-muted/40 p-3 font-mono text-sm">{revealed}</pre>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}