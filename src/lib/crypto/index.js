// Central re-export of all crypto modules + helpers for the UI.

export * from "./aes";
export * from "./chacha";
export * from "./age";
export * from "./openpgp-crypto";
export * from "./kdf";
export * from "./keys";
export * from "./passwords";
export * from "./steganography";
export * from "./emoji-stego";
export * from "./cascade";
export * from "./vault";
export * from "./session";
export { encodingMethods } from "./encoding";
export { classicalCiphers } from "./classical";

// Convert Uint8Array <-> base64 (for transport / display)
export function bytesToBase64(bytes) {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}
export function base64ToBytes(b64) {
  if (typeof b64 !== "string" || !/^[A-Za-z0-9+/]*={0,2}$/.test(b64.trim()) || b64.trim().length % 4 !== 0) {
    throw new Error("Invalid Base64 data");
  }
  const bin = atob(b64.trim());
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function downloadBytes(bytes, filename, mime = "application/octet-stream") {
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadText(text, filename, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Operation history (local only, never sent anywhere)
const HISTORY_KEY = "enc-center-history";
export function addHistory(entry) {
  const items = getHistory();
  items.unshift({ ...entry, time: Date.now() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 50)));
}
export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}
export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}