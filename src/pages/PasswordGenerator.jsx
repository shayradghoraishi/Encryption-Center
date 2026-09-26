import React, { useState, useEffect, useCallback } from "react";
import { Key, RefreshCw } from "lucide-react";
import PageHeader, { SecurityNote } from "@/components/PageHeader";
import SecurityBadge from "@/components/SecurityBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import PasswordStrength from "@/components/PasswordStrength";
import CopyButton from "@/components/CopyButton";
import { generatePassword, generatePassphrase } from "@/lib/crypto/passwords";
import { useI18n } from "@/lib/i18n";

export default function PasswordGenerator() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [length, setLength] = useState(20);
  const [opts, setOpts] = useState({ lower: true, upper: true, digits: true, symbols: true, noAmbiguous: false });
  const [mode, setMode] = useState("random");
  const [output, setOutput] = useState("");
  const [words, setWords] = useState(6);

  const gen = useCallback(() => {
    if (mode === "random") setOutput(generatePassword(length, opts));
    else setOutput(generatePassphrase(words));
  }, [mode, length, opts, words]);

  useEffect(() => { gen(); }, []);

  const toggle = (k) => setOpts((o) => ({ ...o, [k]: !o[k] }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader icon={Key} title={t("pg.title")} subtitle={t("pg.subtitle")}>
        <SecurityBadge level="secure" />
      </PageHeader>

      <div className="mb-4 inline-flex rounded-lg border border-border p-0.5">
        {["random", "passphrase"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${mode === m ? "bg-red-500/15 text-red-400" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t(`pg.${m}`)}
          </button>
        ))}
      </div>

      {mode === "random" ? (
        <div className="space-y-4 rounded-xl border border-border p-5">
          <div>
            <div className="mb-1 flex justify-between">
              <Label>{t("pg.length")}</Label>
              <span className="text-xs text-muted-foreground">{length}</span>
            </div>
            <input type="range" min={4} max={64} value={length} onChange={(e) => setLength(+e.target.value)} className="w-full accent-red-500" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[["lower", "pg.lower"], ["upper", "pg.upper"], ["digits", "pg.digits"], ["symbols", "pg.symbols"], ["noAmbiguous", "pg.noAmbiguous"]].map(([k, lk]) => (
              <button
                key={k}
                onClick={() => toggle(k)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${opts[k] ? "border-red-500/50 bg-red-500/10 text-red-400" : "border-border text-muted-foreground"}`}
              >
                {t(lk)}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-border p-5">
          <div>
            <div className="mb-1 flex justify-between">
              <Label>{t("pg.words")}</Label>
              <span className="text-xs text-muted-foreground">{words}</span>
            </div>
            <input type="range" min={3} max={12} value={words} onChange={(e) => setWords(+e.target.value)} className="w-full accent-red-500" />
          </div>
        </div>
      )}

      <div className="mt-5 flex gap-2">
        <Button onClick={gen} className="flex-1 gap-2">
          <RefreshCw className="h-4 w-4" /> {t("pg.generate")}
        </Button>
        <CopyButton value={output} label={t("pg.copy")} />
      </div>

      <div className="mt-4 rounded-xl border border-border p-4">
        <div className="mb-3 break-all font-mono text-lg">{output || "—"}</div>
        <PasswordStrength password={output} />
      </div>

      <SecurityNote variant="info">
        Generated locally with the browser's cryptographic RNG. Nothing is stored or sent anywhere.
      </SecurityNote>
    </div>
  );
}