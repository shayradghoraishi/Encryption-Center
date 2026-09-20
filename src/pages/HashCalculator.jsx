import React, { useState, useEffect, useCallback } from "react";
import { Hash } from "lucide-react";
import PageHeader, { SecurityNote } from "@/components/PageHeader";
import SecurityBadge from "@/components/SecurityBadge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import CopyButton from "@/components/CopyButton";
import { useI18n } from "@/lib/i18n";

const ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

export default function HashCalculator() {
  const { t } = useI18n();
  const [input, setInput] = useState("");
  const [algo, setAlgo] = useState("SHA-256");
  const [hmacKey, setHmacKey] = useState("");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      const data = new TextEncoder().encode(input);
      let buf;
      if (hmacKey) {
        const key = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(hmacKey),
          { name: "HMAC", hash: algo },
          false,
          ["sign"]
        );
        buf = new Uint8Array(await crypto.subtle.sign("HMAC", key, data));
      } else {
        buf = new Uint8Array(await crypto.subtle.digest(algo, data));
      }
      setOut(Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join(""));
    } catch (e) {
      setOut("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [input, algo, hmacKey]);

  useEffect(() => { run(); }, [input, algo, hmacKey]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader icon={Hash} title={t("hc.title")} subtitle={t("hc.subtitle")}>
        <SecurityBadge level="secure" />
      </PageHeader>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {ALGOS.map((a) => (
            <button
              key={a}
              onClick={() => setAlgo(a)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${algo === a ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-border"}`}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <Label>{t("hc.input")}</Label>
          <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={5} placeholder={t("hc.inputPh")} />
        </div>
        <div className="space-y-2">
          <Label>{t("hc.hmacKey")}</Label>
          <Input value={hmacKey} onChange={(e) => setHmacKey(e.target.value)} placeholder={t("hc.hmacPh")} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{t("hc.output")}</Label>
            <CopyButton value={out} label={t("hc.copy")} />
          </div>
          <pre className="max-h-48 overflow-auto rounded-lg bg-muted/40 p-3 font-mono text-xs break-all whitespace-pre-wrap">
            {loading ? "…" : out || "—"}
          </pre>
        </div>
      </div>

      <SecurityNote variant="info">{t("hc.note")}</SecurityNote>
    </div>
  );
}