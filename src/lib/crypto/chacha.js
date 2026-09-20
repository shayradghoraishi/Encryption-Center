// ChaCha20-Poly1305 via @noble/ciphers (audited, audited primitives).
// Format: salt(16) || nonce(12) || ciphertext+tag
// Key derived from password with Argon2id (or PBKDF2 fallback).

import { chacha20poly1305 } from "@noble/ciphers/chacha";
import { deriveKey } from "./kdf";

const enc = new TextEncoder();
const dec = new TextDecoder();

export async function chachaEncrypt(plaintext, password, kdf = "argon2id") {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, kdf, 32);
  const cipher = chacha20poly1305(key, nonce);
  const ct = cipher.encrypt(enc.encode(plaintext));
  const out = new Uint8Array(salt.length + nonce.length + ct.length);
  out.set(salt, 0);
  out.set(nonce, salt.length);
  out.set(ct, salt.length + nonce.length);
  return out;
}

export async function chachaDecrypt(bytes, password, kdf = "argon2id") {
  const salt = bytes.slice(0, 16);
  const nonce = bytes.slice(16, 28);
  const ct = bytes.slice(28);
  const key = await deriveKey(password, salt, kdf, 32);
  const cipher = chacha20poly1305(key, nonce);
  return dec.decode(cipher.decrypt(ct));
}