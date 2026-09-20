import React, { useState, useEffect, useRef } from "react";
import { Settings as SettingsIcon, Sun, Moon, Trash2, History, ShieldCheck, Zap, Download, Archive, Save, Search, Upload } from "lucide-react";
import PageHeader, { SecurityNote } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/lib/theme";
import { getHistory, clearHistory, downloadBytes, downloadText } from "@/lib/crypto";
import { exportSession, importSession, restoreVaultEntries } from "@/lib/crypto/session";
import { vaultList, vaultIsUnlocked } from "@/lib/crypto/vault";
import PasswordInput from "@/components/PasswordInput";
import { useToast } from "@/components/ui/use-toast";
import { useI18n } from "@/lib/i18n";

const SECTIONS = ["all", "Text", "File", "Steganography"];

export default function Settings() {
  const { theme, toggle } = useTheme();
  const { toast } = useToast();
  const { t } = useI18n();
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [filterSec, setFilterSec] = useState("all");
  const [defaultMethod, setDefaultMethod] = useState(() => localStorage.getItem("enc-default-method") || "aes");

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

  const clearAll = () => { clearHistory(); setHistory([]); toast({ title: "History cleared" }); };
  const saveDefault = (v) => { setDefaultMethod(v); localStorage.setItem("enc-default-method", v); toast({ title: "Default method saved" }); };
  const exportHistory = () => {
    downloadText(JSON.stringify(filtered, null, 2), "history.json");
    toast({ title: `Exported ${filtered.length} entries` });
  };

  const doExportSession = async () => {
    if (!sessionPw) { toast({ title: "Backup password required", variant: "destructive" }); return; }
    try {
      if (includeVault && !vaultIsUnlocked()) toast({ title: "Vault locked — keys not included", variant: "destructive" });
      const bytes = await exportSession(sessionPw, includeVault);
      downloadBytes(bytes, "encryption-center-session.enc");
      toast({ title: "Session backup downloaded" });
    } catch (e) { toast({ title: "Export failed", description: e.message, variant: "destructive" }); }
  };

  const doImportSession = async (file) => {
    if (!sessionPw) { toast({ title: "Backup password required", variant: "destructive" }); return; }
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const payload = await importSession(bytes, sessionPw);
      let restoredKeys = 0;
      if (payload.vault?.length) {
        try { restoredKeys = await restoreVaultEntries(payload.vault); }
        catch (e) { toast({ title: e.message, description: "History & settings restored; unlock the vault and re-import to restore keys.", variant: "destructive" }); }
      }
      toast({ title: "Session imported", description: `${payload.history?.length || 0} history entries${restoredKeys ? `, ${restoredKeys} keys` : ""}. Reloading…` });
      setTimeout(() => location.reload(), 900);
    } catch (e) { toast({ title: "Import failed", description: e.message, variant: "destructive" }); }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader icon={SettingsIcon} title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <div className="space-y-5">
        {/* Theme */}
        <div className="rounded-xl border border-border p-5">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold"><Sun className="h-4 w-4" /> Appearance</h3>
          <p className="mb-4 text-xs text-muted-foreground">Choose your preferred theme. Dark is recommended for reduced eye strain.</p>
          <div className="flex gap-2">
            <button onClick={() => theme !== "dark" && toggle()} className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition ${theme === "dark" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-border"}`}><Moon className="h-4 w-4" /> Dark</button>
            <button onClick={() => theme !== "light" && toggle()} className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition ${theme === "light" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-border"}`}><Sun className="h-4 w-4" /> Light</button>
          </div>
        </div>

        {/* Default method */}
        <div className="rounded-xl border border-border p-5">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold"><Zap className="h-4 w-4" /> Default Encryption Method</h3>
          <p className="mb-4 text-xs text-muted-foreground">Pre-selected when you open the Text Encryption section.</p>
          <div className="flex flex-wrap gap-2">
            {["aes", "chacha", "age", "openpgp"].map((m) => (
              <button key={m} onClick={() => saveDefault(m)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium uppercase transition ${defaultMethod === m ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-border"}`}>{m}</button>
            ))}
          </div>
        </div>

        {/* Session backup */}
        <div className="rounded-xl border border-border p-5">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold"><Save className="h-4 w-4" /> Session Backup (Encrypted)</h3>
          <p className="mb-4 text-xs text-muted-foreground">Download your history & settings (and optionally your Key Vault) as a password-encrypted file. Import it on any device to restore.</p>
          <div className="space-y-3">
            <PasswordInput value={sessionPw} onChange={setSessionPw} placeholder="Backup password" />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={includeVault} onChange={(e) => setIncludeVault(e.target.checked)} className="accent-emerald-500" />
              Include Key Vault (unlock it on the Key Vault page first)
            </label>
            <div className="flex flex-wrap gap-2">
              <Button onClick={doExportSession} size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Export session</Button>
              <input ref={importRef} type="file" accept=".enc" className="hidden" onChange={(e) => e.target.files[0] && doImportSession(e.target.files[0])} />
              <Button variant="outline" size="sm" onClick={() => importRef.current?.click()} className="gap-1.5"><Upload className="h-3.5 w-3.5" /> Import session</Button>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="rounded-xl border border-border p-5">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><History className="h-4 w-4" /> Operation History</h3>
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1.5 text-rose-400 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /> Clear</Button>
            )}
          </div>
          <p className="mb-4 text-xs text-muted-foreground">Stored only in your browser (localStorage). Never sent anywhere.</p>
          {history.length === 0 ? (
            <p className="rounded-lg bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">No operations yet.</p>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search method / mode…" className="pl-8" />
                </div>
                <select value={filterSec} onChange={(e) => setFilterSec(e.target.value)} className="rounded-md border border-border bg-transparent px-2 py-2 text-xs">
                  {SECTIONS.map((s) => <option key={s} value={s} className="bg-card">{s === "all" ? "All sections" : s}</option>)}
                </select>
                <Button variant="outline" size="sm" onClick={exportHistory} className="gap-1.5"><Download className="h-3.5 w-3.5" /> Export</Button>
              </div>
              <div className="max-h-72 space-y-1.5 overflow-y-auto">
                {filtered.map((h, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-xs">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="font-medium">{h.method}</span>
                      <span className="text-muted-foreground">{h.section} · {h.mode}</span>
                    </span>
                    <span className="text-muted-foreground">{new Date(h.time).toLocaleString()}</span>
                  </div>
                ))}
                {filtered.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No matching entries.</p>}
              </div>
            </>
          )}
        </div>

        <SecurityNote variant="info">
          <strong>Security reminder:</strong> Client-side encryption is only as secure as the device running it. Use strong, unique passwords and keep your software updated. For highly sensitive data, consider hardware security keys.
        </SecurityNote>
      </div>
    </div>
  );
}