import React from "react";
import { BookOpen, ShieldCheck, AlertTriangle, Lightbulb } from "lucide-react";
import PageHeader, { SecurityNote } from "@/components/PageHeader";
import SecurityBadge from "@/components/SecurityBadge";
import { useI18n } from "@/lib/i18n";

const METHODS = [
  ["AES-256-GCM", "secure"], ["ChaCha20-Poly1305", "secure"], ["age (X25519 + ChaCha20)", "secure"], ["OpenPGP (symmetric)", "secure"], ["Cascade Encryption", "secure"], ["SHA-256 / HMAC", "secure"], ["Ed25519 Signing", "secure"], ["Key Vault", "secure"], ["Base64 / Hex", "encoding"], ["Classical Ciphers", "educational"], ["LSB Image Steganography", "educational"], ["Zero-width Text Stego", "educational"]
];

export default function Help() {
  const { t } = useI18n();
  const tutorials = t("help.tutorials");
  const methodUses = t("help.methods");
  const methodTips = t("help.methodTips");
  const methods = METHODS;
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader icon={BookOpen} title={t("help.title")} subtitle={t("help.subtitle")} />

      <SecurityNote variant="warn">{t("help.warning")}</SecurityNote>

      <h3 className="mt-8 mb-3 flex items-center gap-2 text-sm font-semibold"><Lightbulb className="h-4 w-4 text-amber-400" /> {t("help.tutorialsTitle")}</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {tutorials.map((tu) => (
          <div key={tu.title} className="rounded-xl border border-border p-4">
            <div className="mb-2 text-sm font-semibold">{tu.title}</div>
            <ol className="space-y-1 text-xs text-muted-foreground">
              {tu.steps.map((s, i) => <li key={i} className="flex gap-1.5"><span className="text-red-400">{i + 1}.</span><span>{s}</span></li>)}
            </ol>
          </div>
        ))}
      </div>

      <h3 className="mt-8 mb-3 flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-red-400" /> {t("help.methodsTitle")}</h3>
      <div className="space-y-2">
        {methods.map(([name, level], index) => (
          <div key={name} className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">{name}</span>
              <SecurityBadge level={level} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{methodUses[index]}</p>
            <p className="mt-1.5 flex items-start gap-1.5 text-xs text-foreground/80">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" /> {methodTips[index]}
            </p>
          </div>
        ))}
      </div>

      <SecurityNote variant="info">
        {t("help.badgeMeanings")}: <strong className="text-red-400">{t("common.secure")}</strong> = {t("help.secureMeaning")} · <strong className="text-amber-400">{t("common.educational")}</strong> = {t("help.educationalMeaning")} · <strong className="text-sky-400">{t("common.encoding")}</strong> = {t("help.encodingMeaning")}.
      </SecurityNote>
    </div>
  );
}