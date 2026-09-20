// Key derivation functions. PBKDF2 via Web Crypto; Argon2id via hash-wasm.

import { argon2id, pbkdf2 } from "hash-wasm";

const enc = new TextEncoder();

export async function deriveKeyPbkdf2(password, salt, iterations = 250000, length = 32) {
  return pbkdf2({ password, salt, iterations, hashLength: length, hashType: "SHA-256", outputType: "binary" });
}

export async function deriveKeyArgon2id(password, salt, length = 32) {
  return argon2id({
    password,
    salt,
    parallelism: 1,
    memorySize: 65536, // 64 MB
    iterations: 3,
    hashLength: length,
    outputType: "binary",
  });
}

export async function deriveKey(password, salt, method = "pbkdf2", length = 32) {
  if (method === "argon2id") return deriveKeyArgon2id(password, salt, length);
  return deriveKeyPbkdf2(password, salt, 250000, length);
}

// Web Crypto PBKDF2 -> AES-GCM key (used directly for AES)
export async function deriveAesKey(password, salt, iterations = 250000) {
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export { enc };