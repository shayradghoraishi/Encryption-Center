import React from "react";
import { ShieldCheck, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const STYLES = {
  secure: {
    className: "bg-green-500/10 text-green-400 border-green-500/30",
    icon: ShieldCheck,
    label: "Secure",
  },
  educational: {
    className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    icon: AlertTriangle,
    label: "Educational",
  },
  deprecated: {
    className: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    icon: AlertTriangle,
    label: "Deprecated",
  },
  none: {
    className: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    icon: Info,
    label: "Encoding",
  },
};

export default function SecurityBadge({ level, className }) {
  const style = STYLES[level] || STYLES.none;
  const Icon = style.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", style.className, className)}>
      <Icon className="h-3 w-3" />
      {style.label}
    </span>
  );
}