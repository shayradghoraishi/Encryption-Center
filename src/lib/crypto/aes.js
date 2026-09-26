// AES-256-GCM via Web Crypto API.
// Password format: EC-A1 || salt(16) || iv(12) || ciphertext+tag

import { deriveAesKey } from "./kdf";

const enc = new TextEncoder();
const dec = new TextDecoder();
const MAGIC = new Uint8Array([0x45, 0x43, 0x2d, 0x41, 0x31]); // EC-A1
const HEADER = MAGIC.length + 16 + 12;

function assertPassword(value) {
  if (typeof value !== "string" || value.length === 0) throw new Error("Password required");
}
function assertBytes(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new Error("Invalid encrypted data");
  if (bytes.length < HEADER + 16) throw new Error("Invalid or truncated encrypted data");
  for (let i = 0; i < MAGIC.length; i++) if (bytes[i] !== MAGIC[i]) throw new Error("Unsupported AES format");
}

export async function aesEncrypt(plaintext, password, iterations = 250000) {
  assertPassword(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(password, salt, iterations);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext)));
  const out = new Uint8Array(HEADER + ct.length);
  out.set(MAGIC, 0); out.set(salt, MAGIC.length); out.set(iv, MAGIC.length + salt.length); out.set(ct, HEADER);
  return out;
}

export async function aesDecrypt(bytes, password, iterations = 250000) {
  assertPassword(password); assertBytes(bytes);
  const salt = bytes.slice(MAGIC.length, MAGIC.length + 16);
  const iv = bytes.slice(MAGIC.length + 16, HEADER);
  const ct = bytes.slice(HEADER);
  const key = await deriveAesKey(password, salt, iterations);
  try {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return dec.decode(pt, { fatal: true });
  } catch {
    throw new Error("Wrong password or corrupted ciphertext");
  }
}

export async function aesEncryptWithKey(plaintext, keyBytes) {
  if (!(keyBytes instanceof Uint8Array) || keyBytes.length !== 32) throw new Error("AES-256 key must be exactly 32 bytes");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext)));
  const out = new Uint8Array(iv.length + ct.length); out.set(iv); out.set(ct, iv.length); return out;
}

export async function aesDecryptWithKey(bytes, keyBytes) {
  if (!(keyBytes instanceof Uint8Array) || keyBytes.length !== 32) throw new Error("AES-256 key must be exactly 32 bytes");
  if (!(bytes instanceof Uint8Array) || bytes.length < 12 + 16) throw new Error("Invalid encrypted data");
  const iv = bytes.slice(0, 12); const ct = bytes.slice(12);
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  try { return dec.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct), { fatal: true }); }
  catch { throw new Error("Wrong key or corrupted ciphertext"); }
}
