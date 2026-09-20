import { useI18n } from "@/lib/i18n";
import React, { useState } from "react";
import { Binary, ArrowRightLeft, Loader2 } from "lucide-react";
import PageHeader, { SecurityNote } from "@/components/PageHeader";
import IOField from "@/components/IOField";
import SecurityBadge from "@/components/SecurityBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { encodingMethods } from "@/lib/crypto/encoding";
import { addHistory } from "@/lib/crypto";

export default function Encoding() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [method, setMethod] = useState("base64");
  const [mode, setMode] = useState("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);

  const m = encodingMethods[method];

  const run = () => {
    if (!input) {
      toast({ title: t("common.nothing"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      let result;
      if (mode === "encode") result = m.encode(input, key);
      else result = m.decode(input, key);
      setOutput(result);
      addHistory({ section: "Encoding", method: m.name, mode, bytes: result.length });
      toast({ title: `${mode === "encode" ? "Encoded" : "Decoded"} successfully` });
    } catch (e) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader icon={Binary} title={t("encoding.title")} subtitle={t("encoding.subtitle")}>
        <SecurityBadge level={m.badge} />
      </PageHeader>

      <SecurityNote variant="warn">
        Encoding is <strong>not encryption</strong>. It provides no confidentiality. Use it for transport or learning, never to protect secrets.
      </SecurityNote>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Object.entries(encodingMethods).map(([key, val]) => (
          <button
            key={key}
            onClick={() => { setMethod(key); setOutput(""); }}
            className={`rounded-lg border p-2.5 text-left transition ${method === key ? "border-amber-500/50 bg-amber-500/5" : "border-border hover:border-muted-foreground/40"}`}
          >
            <span className="text-xs font-semibold">{val.name}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{m.description}</p>

      <div className="mt-5 inline-flex rounded-lg border border-border p-0.5">
        {["encode", "decode"].map((md) => (
          <button
            key={md}
            onClick={() => { setMode(md); setOutput(""); }}
            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition ${mode === md ? "bg-amber-500/15 text-amber-400" : "text-muted-foreground hover:text-foreground"}`}
          >
            {md}
          </button>
        ))}
      </div>

      {method === "xor" && (
        <div className="mt-4 space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">XOR Key</Label>
          <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="Key string" className="font-mono" />
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <IOField label="Input" value={input} onChange={setInput} placeholder="Enter text…" rows={7} />
          <Button onClick={run} disabled={loading} className="w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
            {mode === "encode" ? "Encode" : "Decode"}
          </Button>
        </div>
        <IOField label="Output" value={output} readOnly placeholder="Result…" rows={12} downloadName="encoded.txt" />
      </div>
    </div>
  );
}