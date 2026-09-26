import React, { useState, useEffect, useRef } from "react";
import { Settings as SettingsIcon, Sun, Moon, Trash2, History, ShieldCheck, Zap, Download, Archive, Save, Search, Upload } from "lucide-react";
import PageHeader, { SecurityNote } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/lib/theme";
import { getHistory, clearHistory, downloadBytes, downloadText } from "@/lib/crypto";
import { exportSession, importSession, restoreVaultEntries } from "@/lib/crypto/session";
import { vaultList, vaultIsUnlocked, vaultLock } from "@/lib/crypto/vault";
import PasswordInput from "@/components/PasswordInput";
import { useToast } from "@/components/ui/use-toast";
import { useI18n } from "@/lib/i18n";
import LanguageSelect from "@/components/LanguageSelect";

const SECTIONS = ["all", "Text", "File", "Steganography"];

export default function Settings() {
  const { theme, toggle } = useTheme();
  const { toast } = useToast();
  const { t } = useI18n();
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [filterSec, setFilterSec] = useState("all");
  const [defaultMethod, setDefaultMethod] = useState(() => localStorage.getItem("enc-default-method") || "aes");
  const [developerMode, setDeveloperMode] = useState(() => localStorage.getItem("enc-developer-mode") === "1");

  // Session backup state
  const [sessionPw, setSessionPw] = useState("");
  const [includeVault, setIncludeVault] = useState(false);
  const importRef = useRef(null);
  const [importFile, setImportFile] = useState(null);

  useEffect(() => { setHistory(getHistory()); }, []);

  const filtered = history.filter((h) => {
    if (filterSec !== "all" && h.section !== filterSec) return false;
    if (search && !`${h.method} ${h.mode} ${h.section}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const clearAll = () => { clearHistory(); setHistory([]); toast({ title: t("settings.historyCleared") }); };
  const saveDefault = (v) => { setDefaultMethod(v); localStorage.setItem("enc-default-method", v); toast({ title: t("settings.defaultSaved") }); };
  const clearWorkspace = async () => {
    clearHistory();
    vaultLock();
    try { if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(""); } catch {}
    setHistory([]);
    toast({ title: t("settings.workspaceCleared"), description: t("settings.workspaceDesc") });
  };
  const exportHistory = () => {
    downloadText(JSON.stringify(filtered, null, 2), "history.json");
    toast({ title: `Exported ${filtered.length} entries` });
  };

  const doExportSession = async () => {
    if (!sessionPw) { toast({ title: t("settings.backupRequired"), variant: "destructive" }); return; }
    try {
      if (includeVault && !vaultIsUnlocked()) { toast({ title: t("settings.vaultLocked"), description: t("settings.unlockVaultBackup"), variant: "destructive" }); return; }
      const bytes = await exportSession(sessionPw, includeVault);
      downloadBytes(bytes, "encryption-center-session.enc");
      toast({ title: t("settings.backupDownloaded") });
    } catch (e) { toast({ title: t("settings.exportFailed"), description: e.message, variant: "destructive" }); }
  };

  const doImportSession = async (file) => {
    if (!sessionPw) { toast({ title: t("settings.backupRequired"), variant: "destructive" }); return; }
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const payload = await importSession(bytes, sessionPw);
      let restoredKeys = 0;
      if (payload.vault?.length) {
        try { restoredKeys = await restoreVaultEntries(payload.vault); }
        catch (e) { toast({ title: e.message, description: t("settings.restored"), variant: "destructive" }); }
      }
      toast({ title: t("settings.imported"), description: `${payload.history?.length || 0} history entries${restoredKeys ? `, ${restoredKeys} keys` : ""}. Reloading…` });
      setTimeout(() => location.reload(), 900);
    } catch (e) { toast({ title: t("settings.importFailed"), description: e.message, variant: "destructive" }); }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader icon={SettingsIcon} title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <div className="space-y-5">
        {/* Theme */}
        <div className="rounded-xl border border-border p-5">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold"><Sun className="h-4 w-4" />{t("settings.appearance")}</h3>
          <p className="mb-4 text-xs text-muted-foreground">{t("settings.appearanceDesc")}</p>
          <div className="flex gap-2">
            <button onClick={() => theme !== "dark" && toggle()} className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition ${theme === "dark" ? "border-red-500/50 bg-red-500/10 text-red-400" : "border-border"}`}><Moon className="h-4 w-4" /> {t("settings.dark")}</button>
            <button onClick={() => theme !== "light" && toggle()} className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition ${theme === "light" ? "border-red-500/50 bg-red-500/10 text-red-400" : "border-border"}`}><Sun className="h-4 w-4" /> {t("settings.light")}</button>
          </div>
        </div>

        {/* Language */}
        <div className="rounded-xl border border-border p-5">
          <h3 className="mb-1 text-sm font-semibold">{t("settings.languageTitle")}</h3>
          <p className="mb-4 text-xs text-muted-foreground">{t("settings.languageDescription")}</p>
          <LanguageSelect />
        </div>

        {/* Default method */}
        <div className="rounded-xl border border-border p-5">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold"><Zap className="h-4 w-4" />{t("settings.defaultMethod")}</h3>
          <p className="mb-4 text-xs text-muted-foreground">{t("settings.defaultMethodDesc")}</p>
          <div className="flex flex-wrap gap-2">
            {["aes", "chacha", "age", "openpgp"].map((m) => (
              <button key={m} onClick={() => saveDefault(m)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium uppercase transition ${defaultMethod === m ? "border-red-500/50 bg-red-500/10 text-red-400" : "border-border"}`}>{m}</button>
            ))}
          </div>
        </div>

        {/* Developer mode / environment */}
        <div className="rounded-xl border border-border p-5">
          <div className="flex items-center justify-between gap-4">
            <div><h3 className="mb-1 text-sm font-semibold">{t("settings.developer")}</h3><p className="text-xs text-muted-foreground">{t("settings.developerDesc")}</p></div>
            <button onClick={() => { const next=!developerMode; setDeveloperMode(next); localStorage.setItem("enc-developer-mode", next ? "1" : "0"); }} className={`rounded-lg border px-3 py-1.5 text-xs ${developerMode ? "border-red-500/50 bg-red-500/10 text-red-400" : "border-border"}`}>{developerMode ? "Enabled" : "Disabled"}</button>
          </div>
          {developerMode && <div className="mt-4 grid gap-2 sm:grid-cols-2">{[["App version","2.0.1"],["Runtime",navigator.userAgent],["Secure context",String(window.isSecureContext)],["Crypto API",String(!!window.crypto?.subtle)],["Base URL",import.meta.env.BASE_URL],["Online",String(navigator.onLine)]].map(([k,v])=><div key={k} className="rounded-lg bg-muted/30 p-3"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div><div className="mt-1 break-all font-mono text-[11px]">{v}</div></div>)}</div>}
        </div>

        {/* Workspace cleanup */}
        <div className="rounded-xl border border-border p-5">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold"><Trash2 className="h-4 w-4" /> {t("settings.cleanup")}</h3>
          <p className="mb-4 text-xs leading-5 text-muted-foreground">{t("settings.cleanupDesc")}</p>
          <Button variant="outline" onClick={clearWorkspace} className="gap-2 text-rose-400"><Trash2 className="h-4 w-4"/>{t("settings.clearWorkspace")}</Button>
        </div>

        {/* Session backup */}
        <div className="rounded-xl border border-border p-5">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold"><Save className="h-4 w-4" /> {t("settings.backupTitle")}</h3>
          <p className="mb-4 text-xs text-muted-foreground">{t("settings.backupDesc")}</p>
          <div className="space-y-3">
            <PasswordInput value={sessionPw} onChange={setSessionPw} placeholder={t("settings.backupPassword")} />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={includeVault} onChange={(e) => setIncludeVault(e.target.checked)} className="accent-red-500" />
              Include Key Vault (unlock it on the Key Vault page first)
            </label>
            <div className="flex flex-wrap gap-2">
              <Button onClick={doExportSession} size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> {t("settings.exportSession")}</Button>
              <input ref={importRef} type="file" accept=".enc" className="hidden" onChange={(e) => e.target.files[0] && doImportSession(e.target.files[0])} />
              <Button variant="outline" size="sm" onClick={() => importRef.current?.click()} className="gap-1.5"><Upload className="h-3.5 w-3.5" /> {t("settings.importSession")}</Button>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="rounded-xl border border-border p-5">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><History className="h-4 w-4" /> {t("settings.operationHistory")}</h3>
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1.5 text-rose-400 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /> {t("settings.clear")}</Button>
            )}
          </div>
          <p className="mb-4 text-xs text-muted-foreground">{t("settings.storedLocal")}</p>
          {history.length === 0 ? (
            <p className="rounded-lg bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">{t("settings.noOperations")}</p>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("settings.searchPh")} className="pl-8" />
                </div>
                <select value={filterSec} onChange={(e) => setFilterSec(e.target.value)} className="rounded-md border border-border bg-transparent px-2 py-2 text-xs">
                  {SECTIONS.map((s) => <option key={s} value={s} className="bg-card">{s === "all" ? "All sections" : s}</option>)}
                </select>
                <Button variant="outline" size="sm" onClick={exportHistory} className="gap-1.5"><Download className="h-3.5 w-3.5" /> {t("settings.export")}</Button>
              </div>
              <div className="max-h-72 space-y-1.5 overflow-y-auto">
                {filtered.map((h, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-xs">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-red-400" />
                      <span className="font-medium">{h.method}</span>
                      <span className="text-muted-foreground">{h.section} · {h.mode}</span>
                    </span>
                    <span className="text-muted-foreground">{new Date(h.time).toLocaleString()}</span>
                  </div>
                ))}
                {filtered.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">{t("settings.noMatching")}</p>}
              </div>
            </>
          )}
        </div>

        <SecurityNote variant="info">
          <><strong>{t("settings.securityReminder")}:</strong> {t("settings.securityReminderText")}</>
        </SecurityNote>
      </div>
    </div>
  );
}