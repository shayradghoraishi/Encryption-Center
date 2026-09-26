import React from "react";
import { ShieldCheck, AlertTriangle, Lock } from "lucide-react";

// Reusable page header with title, subtitle, and optional security note.
export default function PageHeader({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export function SecurityNote({ children, variant = "info" }) {
  const styles = {
    info: "border-sky-500/30 bg-sky-500/5 text-sky-300",
    warn: "border-amber-500/30 bg-amber-500/5 text-amber-300",
    danger: "border-rose-500/30 bg-rose-500/5 text-rose-300",
  };
  const Icon = variant === "info" ? ShieldCheck : AlertTriangle;
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-xs leading-relaxed ${styles[variant]}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}