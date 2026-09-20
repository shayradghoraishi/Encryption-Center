import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CopyButton from "./CopyButton";
import DownloadButton from "./DownloadButton";
import { cn } from "@/lib/utils";

// A labelled input/output panel with copy + download actions.
export default function IOField({ label, value, onChange, placeholder, rows = 6, readOnly, mono = true, actions = true, downloadName }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</Label>
        {actions && value && (
          <div className="flex items-center gap-1.5">
            <CopyButton value={value} />
            {downloadName && <DownloadButton value={value} filename={downloadName} />}
          </div>
        )}
      </div>
      <Textarea
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        readOnly={readOnly}
        rows={rows}
        className={cn("resize-y text-sm", mono && "font-mono", readOnly && "bg-muted/40")}
      />
    </div>
  );
}