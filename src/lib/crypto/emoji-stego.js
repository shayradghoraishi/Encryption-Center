// Zero-width character steganography: hide a message inside any cover text
// (including emoji). Uses a 4-symbol zero-width alphabet to encode bytes.

const ZW = ["\u200B", "\u200C", "\u2060", "\u2061"]; // ZWSP, ZWNJ, WJ, function-application
const ZWSET = new Set(ZW);
const SENTINEL = "\u2060\u2061"; // marks the start of the hidden payload

function bytesToZW(bytes) {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    out += ZW[(b >> 6) & 3];
    out += ZW[(b >> 4) & 3];
    out += ZW[(b >> 2) & 3];
    out += ZW[b & 3];
  }
  return out;
}

function zwToBytes(str) {
  const bytes = [];
  for (let i = 0; i + 4 <= str.length; i += 4) {
    let b = 0;
    for (let j = 0; j < 4; j++) {
      const idx = ZW.indexOf(str[i + j]);
      if (idx < 0) return null;
      b = (b << 2) | idx;
    }
    bytes.push(b);
  }
  return bytes.length ? Uint8Array.from(bytes) : null;
}

export function textEmbed(cover, message) {
  const msgBytes = new TextEncoder().encode(message);
  const len = msgBytes.length;
  const header = new Uint8Array([
    (len >> 24) & 255, (len >> 16) & 255, (len >> 8) & 255, len & 255,
  ]);
  const all = new Uint8Array(header.length + msgBytes.length);
  all.set(header, 0);
  all.set(msgBytes, header.length);
  return cover + SENTINEL + bytesToZW(all);
}

export function textExtract(carrier) {
  if (!carrier) return null;
  const idx = carrier.indexOf(SENTINEL);
  const stream = idx >= 0 ? carrier.slice(idx + SENTINEL.length) : carrier;
  let zwOnly = "";
  for (const ch of stream) if (ZWSET.has(ch)) zwOnly += ch;
  const bytes = zwToBytes(zwOnly);
  if (!bytes || bytes.length < 4) return null;
  const len = (bytes[0] * 0x1000000) + (bytes[1] * 0x10000) + (bytes[2] * 0x100) + bytes[3];
  if (len < 0 || len > bytes.length - 4) return null;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes.slice(4, 4 + len));
  } catch {
    return null;
  }
}

export function textCapacity(cover) {
  // No real limit (payload is appended), but keep a sane displayed estimate.
  return cover ? `${cover.length} cover chars` : "—";
}