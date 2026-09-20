import React, { useState } from "react";
import { Eye, EyeOff, Wand2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { generatePassword, generatePassphrase } from "@/lib/crypto/passwords";
import PasswordStrength from "./PasswordStrength";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export default function PasswordInput({ value, onChange, placeholder, showStrength = true, className }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const ph = placeholder || t("common.passwordPh") || "Enter password…";

  const gen = () => {
    const pw = generatePassword(20, { lower: true, upper: true, digits: true, symbols: true, noAmbiguous: true });
    onChange(pw);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={ph}
          className="pr-24 font-mono"
        />
        <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            title={visible ? t("common.hide") || "Hide" : t("common.show") || "Show"}
            className="rounded p-1.5 text-muted-foreground transition hover:text-foreground"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={gen}
            title={t("common.generate") || "Generate"}
            className="rounded p-1.5 text-muted-foreground transition hover:text-foreground"
          >
            <Wand2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {showStrength && <PasswordStrength password={value} />}
    </div>
  );
}