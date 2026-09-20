// Cascade (multi-layer) encryption over password-based symmetric ciphers.
// Layers are applied in order on encrypt and reversed on decrypt.
// Each layer: { kind: "aes" | "chacha", password }
// Formats per layer:
//   aes:    salt(16) || iv(12) || ciphertext+tag   (AES-256-GCM, PBKDF2 250k)
//   chacha: salt(16) || nonce(12) || ciphertext+tag (ChaCha20-Poly1305, PBKDF2 250k)

import { deriveAesKey } from "./kdf";
import { chacha20poly1305 } from "@noble/ciphers/chacha";

const enc = new TextEncoder();
const dec = new TextDecoder();

async function deriveChachaKey(password, salt) {
  const km = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" }, km, 256);
  return new Uint8Array(bits);
}

async function aesEnc(data, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(password, salt);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data));
  const out = new Uint8Array(salt.length + iv.length + ct.length);
  out.set(salt, 0); out.set(iv, salt.length); out.set(ct, salt.length + iv.length);
  return out;
}

async function aesDec(bytes, password) {
  const salt = bytes.slice(0, 16);
  const iv = bytes.slice(16, 28);
  const ct = bytes.slice(28);
  const key = await deriveAesKey(password, salt);
  return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct));
}

async function chachaEnc(data, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveChachaKey(password, salt);
  const ct = chacha20poly1305(key, nonce).encrypt(data);
  const out = new Uint8Array(salt.length + nonce.length + ct.length);
  out.set(salt, 0); out.set(nonce, salt.length); out.set(ct, salt.length + nonce.length);
  return out;
}

async function chachaDec(bytes, password) {
  const salt = bytes.slice(0, 16);
  const nonce = bytes.slice(16, 28);
  const ct = bytes.slice(28);
  const key = await deriveChachaKey(password, salt);
  return chacha20poly1305(key, nonce).decrypt(ct);
}

export async function cascadeEncrypt(plaintext, layers) {
  if (!layers?.length) throw new Error("Add at least one layer");
  let data = enc.encode(plaintext);
  for (const l of layers) {
    if (!l.password) throw new Error("Each layer needs a password");
    data = l.kind === "chacha" ? await chachaEnc(data, l.password) : await aesEnc(data, l.password);
  }
  return data; // Uint8Array
}

export async function cascadeDecrypt(bytes, layers) {
  if (!layers?.length) throw new Error("Add at least one layer");
  let data = bytes;
  for (let i = layers.length - 1; i >= 0; i--) {
    const l = layers[i];
    if (!l.password) throw new Error("Each layer needs a password");
    data = l.kind === "chacha" ? await chachaDec(data, l.password) : await aesDec(data, l.password);
  }
  return dec.decode(data);
}