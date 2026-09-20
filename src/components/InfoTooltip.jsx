import React from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function InfoTooltip({ text, className }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className={cn("text-muted-foreground/60 transition hover:text-foreground", className)}>
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}