// ChaCha20-Poly1305 via @noble/ciphers.
// Format: EC-C1 || salt(16) || nonce(12) || ciphertext+tag

import { chacha20poly1305 } from "@noble/ciphers/chacha";
import { deriveKey } from "./kdf";

const enc = new TextEncoder();
const dec = new TextDecoder();
const MAGIC = new Uint8Array([0x45, 0x43, 0x2d, 0x43, 0x31]); // EC-C1
const HEADER = MAGIC.length + 16 + 12;

function validate(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < HEADER + 16) throw new Error("Invalid or truncated encrypted data");
  for (let i = 0; i < MAGIC.length; i++) if (bytes[i] !== MAGIC[i]) throw new Error("Unsupported ChaCha20 format");
}

export async function chachaEncrypt(plaintext, password, kdf = "argon2id") {
  if (!password) throw new Error("Password required");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, kdf, 32);
  const ct = chacha20poly1305(key, nonce).encrypt(enc.encode(plaintext));
  const out = new Uint8Array(HEADER + ct.length);
  out.set(MAGIC); out.set(salt, MAGIC.length); out.set(nonce, MAGIC.length + 16); out.set(ct, HEADER);
  return out;
}

export async function chachaDecrypt(bytes, password, kdf = "argon2id") {
  if (!password) throw new Error("Password required");
  validate(bytes);
  const salt = bytes.slice(MAGIC.length, MAGIC.length + 16);
  const nonce = bytes.slice(MAGIC.length + 16, HEADER);
  const ct = bytes.slice(HEADER);
  const key = await deriveKey(password, salt, kdf, 32);
  try { return dec.decode(chacha20poly1305(key, nonce).decrypt(ct), { fatal: true }); }
  catch { throw new Error("Wrong password or corrupted ciphertext"); }
}
