// age-style encryption: X25519 ephemeral key exchange + ChaCha20-Poly1305.
// Simplified format (not byte-compatible with the real age spec):
//   ephemeral_pub(32) || nonce(12) || ciphertext+tag
// Recipient public key is an X25519 (Curve25519) public key.

import nacl from "tweetnacl";
import { chacha20poly1305 } from "@noble/ciphers/chacha";
import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha256";

const enc = new TextEncoder();
const dec = new TextDecoder();

export function generateAgeKeyPair() {
  const kp = nacl.box.keyPair();
  return {
    publicKey: kp.publicKey,
    secretKey: kp.secretKey,
    publicKeyB64: naclutil_encode(kp.publicKey),
    secretKeyB64: naclutil_encode(kp.secretKey),
  };
}

export async function ageEncrypt(plaintext, recipientPublicKeyB64) {
  const recipientPub = naclutil_decode(recipientPublicKeyB64);
  const eph = nacl.box.keyPair();
  const shared = nacl.box.before(recipientPub, eph.secretKey);
  const key = hkdf(sha256, shared, undefined, "age-encryption", 32);
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const cipher = chacha20poly1305(key, nonce);
  const ct = cipher.encrypt(enc.encode(plaintext));
  const out = new Uint8Array(32 + nonce.length + ct.length);
  out.set(eph.publicKey, 0);
  out.set(nonce, 32);
  out.set(ct, 32 + nonce.length);
  return out;
}

export async function ageDecrypt(bytes, secretKeyB64) {
  const secretKey = naclutil_decode(secretKeyB64);
  const ephPub = bytes.slice(0, 32);
  const nonce = bytes.slice(32, 44);
  const ct = bytes.slice(44);
  const shared = nacl.box.before(ephPub, secretKey);
  const key = hkdf(sha256, shared, undefined, "age-encryption", 32);
  const cipher = chacha20poly1305(key, nonce);
  return dec.decode(cipher.decrypt(ct));
}

// helpers (avoid importing tweetnacl-util to keep bundle lean)
function naclutil_encode(bytes) {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}
function naclutil_decode(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}