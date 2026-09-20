// Key management: RSA & ECDSA (Web Crypto), Ed25519 (tweetnacl).
// All generation happens client-side.

import nacl from "tweetnacl";

const enc = new TextEncoder();
const dec = new TextDecoder();

export async function generateRsaKeyPair(bits = 2048) {
  const keyPair = await crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: bits, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["encrypt", "decrypt"]
  );
  const [publicKey, privateKey] = await Promise.all([
    crypto.subtle.exportKey("spki", keyPair.publicKey),
    crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
  ]);
  return {
    publicKey: pemFromBuffer(new Uint8Array(publicKey), "PUBLIC KEY"),
    privateKey: pemFromBuffer(new Uint8Array(privateKey), "PRIVATE KEY"),
  };
}

export async function generateEcdsaKeyPair(curve = "P-256") {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: curve },
    true,
    ["sign", "verify"]
  );
  const [publicKey, privateKey] = await Promise.all([
    crypto.subtle.exportKey("spki", keyPair.publicKey),
    crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
  ]);
  return {
    publicKey: pemFromBuffer(new Uint8Array(publicKey), "PUBLIC KEY"),
    privateKey: pemFromBuffer(new Uint8Array(privateKey), "PRIVATE KEY"),
  };
}

export function generateEd25519KeyPair() {
  const kp = nacl.sign.keyPair();
  return {
    publicKey: base64(kp.publicKey),
    secretKey: base64(kp.secretKey),
  };
}

export function ed25519Sign(message, secretKeyB64) {
  const sk = fromBase64(secretKeyB64);
  const sig = nacl.sign.detached(enc.encode(message), sk);
  return base64(sig);
}

export function ed25519Verify(message, signatureB64, publicKeyB64) {
  try {
    return nacl.sign.detached.verify(enc.encode(message), fromBase64(signatureB64), fromBase64(publicKeyB64));
  } catch {
    return false;
  }
}

// Byte-based Ed25519 signing/verification for files and binary data.
export function ed25519SignBytes(data, secretKeyB64) {
  const sk = fromBase64(secretKeyB64);
  return base64(nacl.sign.detached(data, sk));
}

export function ed25519VerifyBytes(data, signatureB64, publicKeyB64) {
  try {
    return nacl.sign.detached.verify(data, fromBase64(signatureB64), fromBase64(publicKeyB64));
  } catch {
    return false;
  }
}

// --- helpers ---
function base64(bytes) {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}
function fromBase64(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function pemFromBuffer(bytes, label) {
  const b64 = base64(bytes).match(/.{1,64}/g).join("\n");
  return `-----BEGIN ${label}-----\n${b64}\n-----END ${label}-----\n`;
}