// Shared ECV2 constants for documentation and future cross-runtime implementations.
export const ECV2 = Object.freeze({
  magic: "ECV2",
  algorithm: "AES-256-GCM",
  kdf: "PBKDF2-HMAC-SHA-256",
  iterations: 250000,
  chunkSize: 1024 * 1024,
  saltBytes: 16,
  nonceBytes: 12,
  tagBytes: 16,
  headerBytes: 36,
});
