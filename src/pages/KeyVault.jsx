import React, { useState } from "react";
import { Shield, Lock, Unlock, Plus, Trash2, KeyRound, Eye, EyeOff } from "lucide-react";
import PageHeader, { SecurityNote } from "@/components/PageHeader";
import SecurityBadge from "@/components/SecurityBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import PasswordInput from "@/components/PasswordInput";
import {
  vaultExists, vaultCreate, vaultUnlock, vaultLock,
  vaultList, vaultAdd, vaultDelete, vaultChangePassword, vaultDestroy,
} from "@/lib/crypto/vault";
import { useI18n } from "@/lib/i18n";

export default function KeyVault() {
  const { t } = useI18n();
  const { toast } = useToast();
  const exists = vaultExists();
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [entries, setEntries] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ name: "", type: "Ed25519", publicKey: "", privateKey: "" });
  const [reveal, setReveal] = useState({});
  const [newPw, setNewPw] = useState("");
  const [showChange, setShowChange] = useState(false);

  const refresh = () => setEntries(vaultList());

  const doCreate = async () => {
    if (pw.length < 8) { toast({ title: "Master password too short (min 8)", variant: "destructive" }); return; }
    try { await vaultCreate(pw); setUnlocked(true); refresh(); setPw(""); toast({ title: "Vault created" }); }
    catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  };

  const doUnlock = async () => {
    try { await vaultUnlock(pw); setUnlocked(true); refresh(); setPw(""); toast({ title: "Vault unlocked" }); }
    catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  };

  const doLock = () => { vaultLock(); setUnlocked(false); setEntries([]); toast({ title: "Vault locked" }); };

  const doAdd = async () => {
    if (!newEntry.name || !newEntry.privateKey) { toast({ title: "Name and private key required", variant: "destructive" }); return; }
    try { await vaultAdd(newEntry); setNewEntry({ name: "", type: "Ed25519", publicKey: "", privateKey: "" }); setShowAdd(false); refresh(); toast({ title: "Key added to vault" }); }
    catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  };

  const doDelete = async (id) => {
    try { await vaultDelete(id); refresh(); toast({ title: "Key deleted" }); }
    catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  };

  const doChange = async () => {
    if (newPw.length < 8) { toast({ title: "New password too short (min 8)", variant: "destructive" }); return; }
    try { await vaultChangePassword(newPw); setNewPw(""); setShowChange(false); toast({ title: "Master password changed" }); }
    catch (e) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  };

  const doDestroy = async () => {
    if (!confirm("Destroy the vault and all stored keys? This cannot be undone.")) return;
    await vaultDestroy(); setUnlocked(false); setEntries([]); toast({ title: "Vault destroyed" });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader icon={Shield} title={t("vault.title")} subtitle={t("vault.subtitle")}>
        <SecurityBadge level="secure" />
      </PageHeader>

      {!unlocked ? (
        <div className="max-w-sm space-y-3 rounded-xl border border-border p-5">
          {exists ? (
            <>
              <div className="flex items-center gap-2 text-sm font-semibold"><Unlock className="h-4 w-4 text-emerald-400" /> Unlock vault</div>
              <PasswordInput value={pw} onChange={setPw} placeholder="Master password" />
              <Button onClick={doUnlock} className="w-full gap-2"><Unlock className="h-4 w-4" /> Unlock</Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm font-semibold"><Lock className="h-4 w-4 text-emerald-400" /> Create vault</div>
              <p className="text-xs text-muted-foreground">Set a strong master password. It encrypts all keys and cannot be recovered.</p>
              <PasswordInput value={pw} onChange={setPw} placeholder="Master password (min 8)" />
              <Button onClick={doCreate} className="w-full gap-2"><Lock className="h-4 w-4" /> Create vault</Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAdd((s) => !s)} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add key</Button>
            <Button variant="outline" size="sm" onClick={() => setShowChange((s) => !s)} className="gap-1.5"><KeyRound className="h-3.5 w-3.5" /> Change password</Button>
            <Button variant="ghost" size="sm" onClick={doLock} className="gap-1.5"><Lock className="h-3.5 w-3.5" /> Lock</Button>
            <Button variant="ghost" size="sm" onClick={doDestroy} className="gap-1.5 text-rose-400"><Trash2 className="h-3.5 w-3.5" /> Destroy</Button>
          </div>

          {showAdd && (
            <div className="space-y-3 rounded-xl border border-border p-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase text-muted-foreground">Name</Label>
                  <Input value={newEntry.name} onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })} placeholder="e.g. GitHub signing key" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase text-muted-foreground">Type</Label>
                  <Input value={newEntry.type} onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })} placeholder="Ed25519 / RSA / age" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase text-muted-foreground">Public key (optional)</Label>
                <Textarea value={newEntry.publicKey} onChange={(e) => setNewEntry({ ...newEntry, publicKey: e.target.value })} rows={2} className="font-mono text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase text-muted-foreground">Private key</Label>
                <Textarea value={newEntry.privateKey} onChange={(e) => setNewEntry({ ...newEntry, privateKey: e.target.value })} rows={3} className="font-mono text-xs" />
              </div>
              <Button onClick={doAdd} size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Save to vault</Button>
            </div>
          )}

          {showChange && (
            <div className="flex items-end gap-2 rounded-xl border border-border p-4">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs uppercase text-muted-foreground">New master password</Label>
                <PasswordInput value={newPw} onChange={setNewPw} placeholder="New master password" />
              </div>
              <Button onClick={doChange} size="sm">Change</Button>
            </div>
          )}

          {entries.length === 0 ? (
            <p className="rounded-lg bg-muted/40 px-3 py-8 text-center text-sm text-muted-foreground">No keys stored yet.</p>
          ) : (
            <div className="space-y-2">
              {entries.map((e) => (
                <div key={e.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{e.name}</div>
                      <div className="text-xs text-muted-foreground">{e.type}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => doDelete(e.id)} className="gap-1.5 text-rose-400"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                  {e.publicKey && (
                    <div className="mt-2">
                      <div className="text-[11px] uppercase text-muted-foreground">Public key</div>
                      <pre className="mt-1 max-h-20 overflow-auto rounded-md bg-muted/40 p-2 font-mono text-xs">{e.publicKey}</pre>
                    </div>
                  )}
                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase text-muted-foreground">Private key</span>
                      <button onClick={() => setReveal((r) => ({ ...r, [e.id]: !r[e.id] }))} className="text-muted-foreground hover:text-foreground">
                        {reveal[e.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <pre className="mt-1 max-h-24 overflow-auto rounded-md bg-muted/40 p-2 font-mono text-xs break-all whitespace-pre-wrap">
                      {reveal[e.id] ? e.privateKey : "•".repeat(24)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <SecurityNote variant="warn">
        The vault is encrypted at rest with AES-256-GCM (PBKDF2 300k). It lives only in this browser — clearing site data or switching devices loses it. Back up your keys elsewhere. A forgotten master password cannot be recovered.
      </SecurityNote>
    </div>
  );
}