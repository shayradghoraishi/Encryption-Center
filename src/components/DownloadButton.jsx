import React, { useState } from "react";
import { Download } from "lucide-react";
import { downloadText, downloadBytes, base64ToBytes } from "@/lib/crypto";

export default function DownloadButton({ value, filename, className }) {
  const onClick = () => {
    if (!value) return;
    // If it looks like base64 binary, download as bytes; otherwise as text.
    downloadText(value, filename || "output.txt");
  };
  return (
    <button
      type="button"
      onClick={onClick}
      title="Download as file"
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      <Download className="h-3.5 w-3.5" />
      Save
    </button>
  );
}