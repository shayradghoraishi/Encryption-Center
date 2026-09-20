// Encrypted session backup: bundle history + settings (+ optional vault entries)
// into a password-encrypted blob (AES-256-GCM, PBKDF2 250k) for download/import.

import { vaultList, vaultIsUnlocked, vaultAdd } from "./vault";

const HKEY = "enc-center-history";
const SETTINGS_KEYS = ["enc-lang", "enc-advanced-mode", "enc-default-method"];

function b64(bytes) { let s = ""; bytes.forEach((b) => (s += String.fromCharCode(b))); return btoa(s); }
function fromB64(s) { const b = atob(s); const a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }

function readHistory() { try { return JSON.parse(localStorage.getItem(HKEY) || "[]"); } catch { return []; } }
function writeHistory(h) { localStorage.setItem(HKEY, JSON.stringify(h)); }

async function deriveKey(password, salt) {
  const km = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" }, km, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

export async function exportSession(password, includeVault) {
  if (!password) throw new Error("Backup password required");
  const settings = {};
  for (const k of SETTINGS_KEYS) settings[k] = localStorage.getItem(k);
  const payload = {
    v: 1, t: Date.now(),
    history: readHistory(),
    settings,
    vault: includeVault ? vaultList() : [],
  };
  const json = new TextEncoder().encode(JSON.stringify(payload));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, json));
  const out = new Uint8Array(salt.length + iv.length + ct.length);
  out.set(salt, 0); out.set(iv, 16); out.set(ct, 28);
  return out;
}

export async function importSession(bytes, password) {
  if (!password) throw new Error("Backup password required");
  if (bytes.length < 29) throw new Error("Invalid backup file");
  const salt = bytes.slice(0, 16);
  const iv = bytes.slice(16, 28);
  const ct = bytes.slice(28);
  const key = await deriveKey(password, salt);
  let pt;
  try { pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct); }
  catch { throw new Error("Wrong password or corrupted backup"); }
  const payload = JSON.parse(new TextDecoder().decode(pt));

  if (Array.isArray(payload.history)) writeHistory(payload.history);
  if (payload.settings) {
    for (const k of SETTINGS_KEYS) {
      if (payload.settings[k] != null) localStorage.setItem(k, payload.settings[k]);
    }
  }
  return payload;
}

// Restore vault entries from an imported session into an unlocked vault.
export async function restoreVaultEntries(entries) {
  if (!Array.isArray(entries) || !entries.length) return 0;
  if (!vaultIsUnlocked()) throw new Error("Unlock the Key Vault first");
  let n = 0;
  for (const e of entries) { await vaultAdd(e); n++; }
  return n;
}