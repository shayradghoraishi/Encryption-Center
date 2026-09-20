// AES-256-GCM via the Web Crypto API. Authenticated encryption.
// Format: salt(16) || iv(12) || ciphertext+tag

import { deriveAesKey } from "./kdf";

const enc = new TextEncoder();
const dec = new TextDecoder();

export async function aesEncrypt(plaintext, password, iterations = 250000) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(password, salt, iterations);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext)));
  const out = new Uint8Array(salt.length + iv.length + ct.length);
  out.set(salt, 0);
  out.set(iv, salt.length);
  out.set(ct, salt.length + iv.length);
  return out;
}

export async function aesDecrypt(bytes, password, iterations = 250000) {
  const salt = bytes.slice(0, 16);
  const iv = bytes.slice(16, 28);
  const ct = bytes.slice(28);
  const key = await deriveAesKey(password, salt, iterations);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return dec.decode(pt);
}

// Raw-key AES-GCM (encrypt with a provided 32-byte key instead of a password)
export async function aesEncryptWithKey(plaintext, keyBytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext)));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv, 0);
  out.set(ct, iv.length);
  return out;
}

export async function aesDecryptWithKey(bytes, keyBytes) {
  const iv = bytes.slice(0, 12);
  const ct = bytes.slice(12);
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return dec.decode(pt);
}