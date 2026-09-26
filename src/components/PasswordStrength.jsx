import React from "react";
import { estimateStrength } from "@/lib/crypto/passwords";
import { cn } from "@/lib/utils";

const BARS = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-lime-500",
  "bg-green-500",
];

export default function PasswordStrength({ password, className }) {
  const { score, label, entropy } = estimateStrength(password);
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex h-1.5 w-full gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "h-full flex-1 rounded-full transition-colors duration-300",
              i <= score ? BARS[score] : "bg-muted"
            )}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          Strength: <span className={cn("font-medium", score >= 3 ? "text-green-400" : score >= 2 ? "text-amber-400" : "text-rose-400")}>{label}</span>
        </span>
        {password && <span>{entropy} bits entropy</span>}
      </div>
    </div>
  );
}