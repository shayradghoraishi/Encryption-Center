import React, { useState } from "react";
import { Heart, Copy, Check } from "lucide-react";
import PageHeader, { SecurityNote } from "@/components/PageHeader";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// Wallet addresses
const COINS = [
  { ticker: "BTC", name: "Bitcoin", color: "#f7931a", symbol: "₿", address: "bc1qhkmq63kmdzh2jq9kgqs7sfkmwxlpquf50ktm5a" },
  { ticker: "ETH", name: "Ethereum", color: "#627eea", symbol: "Ξ", address: "0xD84E98aD1396f893Fd02BA26b1F01F95566572f0" },
  { ticker: "SOL", name: "Solana", color: "#14f195", symbol: "◎", address: "BuYtEAJyReyT8rD6xzQnchyLL9M9nebcuwaDwutjy8ge" },
  { ticker: "BNB", name: "BNB", color: "#f3ba2f", symbol: "⬡", address: "0xD84E98aD1396f893Fd02BA26b1F01F95566572f0" },
];

function CoinIcon({ coin }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow" style={{ background: coin.color }}>
      {coin.symbol}
    </div>
  );
}

export default function Donate() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [copied, setCopied] = useState(null);

  const copy = (coin) => {
    navigator.clipboard.writeText(coin.address).then(() => {
      setCopied(coin.ticker);
      toast({ title: `${coin.ticker} address copied` });
      setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader icon={Heart} title={t("donate.title")} subtitle={t("donate.subtitle")} />

      <SecurityNote variant="info">
        This is a free, open, client-side tool. Donations help keep it running and improving. Always double-check addresses before sending.
      </SecurityNote>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {COINS.map((coin) => (
          <div key={coin.ticker} className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <CoinIcon coin={coin} />
              <div className="min-w-0">
                <div className="text-sm font-semibold">{coin.name}</div>
                <div className="text-xs text-muted-foreground">{coin.ticker}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-md bg-muted/40 px-2.5 py-2 font-mono text-xs">{coin.address}</code>
              <button
                onClick={() => copy(coin)}
                className={cn("shrink-0 rounded-md border border-border p-2 transition hover:bg-muted", copied === coin.ticker && "border-red-500/50 text-red-400")}
                aria-label={`Copy ${coin.ticker} address`}
              >
                {copied === coin.ticker ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Built with ❤️ ·{" "}
        <a
          href="https://github.com/shayradghoraishi"
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-400 underline-offset-2 hover:underline"
        >
          github.com/shayradghoraishi
        </a>
      </p>
    </div>
  );
}