// Secure local Key Vault: stores encrypted private keys in localStorage.
// The vault blob is AES-256-GCM encrypted with a key derived from a master
// password via PBKDF2 (300k iterations). The derived key and decrypted entries
// live only in memory and are cleared on lock. Nothing leaves the browser.

const STORE_KEY = "enc-vault";

function b64(bytes) { let s = ""; bytes.forEach((b) => (s += String.fromCharCode(b))); return btoa(s); }
function fromB64(s) { const b = atob(s); const a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }

async function deriveKey(password, salt) {
  const km = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 300000, hash: "SHA-256" }, km, 256);
  return crypto.subtle.importKey("raw", new Uint8Array(bits), { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

let keyInMemory = null; // CryptoKey
let entries = null;    // array (in memory only)

export function vaultExists() { return !!localStorage.getItem(STORE_KEY); }

export async function vaultCreate(password) {
  if (vaultExists()) throw new Error("Vault already exists");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode("[]")));
  localStorage.setItem(STORE_KEY, JSON.stringify({ salt: b64(salt), iv: b64(iv), ct: b64(ct) }));
  keyInMemory = key;
  entries = [];
}

export async function vaultUnlock(password) {
  const raw = JSON.parse(localStorage.getItem(STORE_KEY));
  const salt = fromB64(raw.salt);
  const iv = fromB64(raw.iv);
  const ct = fromB64(raw.ct);
  const key = await deriveKey(password, salt);
  let pt;
  try {
    pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  } catch {
    throw new Error("Wrong master password");
  }
  keyInMemory = key;
  entries = JSON.parse(new TextDecoder().decode(pt));
  return entries;
}

export function vaultLock() { keyInMemory = null; entries = null; }
export function vaultIsUnlocked() { return !!keyInMemory; }
export function vaultList() { return entries ? [...entries] : []; }

async function persist() {
  if (!keyInMemory) throw new Error("Vault locked");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, keyInMemory, new TextEncoder().encode(JSON.stringify(entries))));
  const raw = JSON.parse(localStorage.getItem(STORE_KEY));
  localStorage.setItem(STORE_KEY, JSON.stringify({ salt: raw.salt, iv: b64(iv), ct: b64(ct) }));
}

export async function vaultAdd(entry) {
  if (!entries) throw new Error("Vault locked");
  const item = { id: crypto.randomUUID(), createdAt: Date.now(), ...entry };
  entries.push(item);
  await persist();
  return item;
}

export async function vaultDelete(id) {
  if (!entries) throw new Error("Vault locked");
  entries = entries.filter((e) => e.id !== id);
  await persist();
}

export async function vaultChangePassword(newPassword) {
  if (!entries) throw new Error("Vault locked");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(newPassword, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(entries))));
  localStorage.setItem(STORE_KEY, JSON.stringify({ salt: b64(salt), iv: b64(iv), ct: b64(ct) }));
  keyInMemory = key;
}

export async function vaultDestroy() {
  localStorage.removeItem(STORE_KEY);
  keyInMemory = null;
  entries = null;
}