import React from "react";
import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function LanguageSelect({ compact = false }) {
  const { lang, setLang, t } = useI18n();
  return (
    <label className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-2.5 py-2 text-xs text-muted-foreground">
      <Languages className="h-4 w-4 shrink-0" />
      {!compact && <span className="sr-only sm:not-sr-only">{t("language.label")}</span>}
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        aria-label={t("common.selectLanguage")}
        className="bg-transparent font-medium text-foreground outline-none"
      >
        <option value="en">{t("language.english")}</option>
        <option value="fa">{t("language.persian")}</option>
      </select>
    </label>
  );
}
