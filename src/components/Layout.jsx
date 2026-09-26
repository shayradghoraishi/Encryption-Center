import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  Lock, Binary, ScrollText, FileKey, Image, KeyRound, Settings,
  ShieldCheck, Menu, X, Sun, Moon, Key, Hash, BookOpen, Heart, Shield, Github, FileSignature, ScanSearch, EyeOff, Calculator,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { useAdvancedMode } from "@/lib/advanced-mode";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import LanguageSelect from "@/components/LanguageSelect";

export const NAV_ITEMS = [
  { to: "/", key: "text", icon: Lock, end: true },
  { to: "/encoding", key: "encoding", icon: Binary },
  { to: "/files", key: "files", icon: FileKey },
  { to: "/steganography", key: "steganography", icon: Image },
  { to: "/passwords", key: "passwords", icon: Key },
  { to: "/hashes", key: "hashes", icon: Hash },
  { to: "/classical", key: "classical", icon: ScrollText, advanced: true },
  { to: "/keys", key: "keys", icon: KeyRound, advanced: true },
  { to: "/vault", key: "vault", icon: Shield, advanced: true },
  { to: "/signatures", key: "signatures", icon: FileSignature, advanced: true },
  { to: "/inspector", key: "inspector", icon: ScanSearch, advanced: true },
  { to: "/security", key: "security", icon: ShieldCheck },
  { to: "/privacy", key: "privacy", icon: EyeOff },
  { to: "/calculator", key: "calculator", icon: Calculator, advanced: true },
  { to: "/help", key: "help", icon: BookOpen },
  { to: "/donate", key: "donate", icon: Heart },
  { to: "/settings", key: "settings", icon: Settings },
];

function SidebarContent({ onNavigate }) {
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  const { advanced, toggle: toggleAdvanced } = useAdvancedMode();
  const items = NAV_ITEMS.filter((i) => !i.advanced || advanced);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-red-500/30 bg-black/80 shadow-lg shadow-red-500/20 ring-1 ring-red-500/10">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" aria-hidden="true" className="h-full w-full object-contain p-1" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight">{t("brand")}</h1>
          <p className="text-[11px] text-muted-foreground">{t("brandTag")}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "group flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                  isActive ? "bg-red-500/10 text-red-400 shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex flex-col">
                <span className="font-medium leading-tight">{t(`nav.${item.key}`)}</span>
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-border px-3 py-3">
        <button
          onClick={toggleAdvanced}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition",
            advanced ? "border-amber-500/50 bg-amber-500/10 text-amber-400" : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          <span>{advanced ? t("mode.advanced") : t("mode.simple")}</span>
          <span className={cn("relative h-4 w-7 rounded-full transition", advanced ? "bg-amber-500" : "bg-muted-foreground/40")}>
            <span className={cn("absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all", advanced ? "left-3.5" : "left-0.5")} />
          </span>
        </button>

        <div className="flex items-center gap-2">
          <LanguageSelect compact />
          <Button variant="ghost" size="sm" onClick={toggle} className="flex-1 justify-start gap-2 text-muted-foreground">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? t("theme.light") : t("theme.dark")}
          </Button>
        </div>

        <a
          href="https://github.com/shayradghoraishi"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Github className="h-4 w-4 shrink-0" />
          <span className="truncate">github.com/shayradghoraishi</span>
        </a>
      </div>
    </div>
  );
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useI18n();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside className="hidden w-72 shrink-0 border-r border-border bg-card/30 backdrop-blur lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-border bg-card shadow-2xl animate-in slide-in-from-left duration-200">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg border border-red-500/30 bg-black/80 shadow-sm shadow-red-500/20">
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" aria-hidden="true" className="h-full w-full object-contain p-0.5" />
            </div>
            <span className="text-sm font-semibold">{t("brand")}</span>
          </div>
          <LanguageSelect compact />
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}