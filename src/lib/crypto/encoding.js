// Encoding & obfuscation methods (educational / utility).
// These are NOT encryption — they provide no confidentiality.

const Base58 = (() => {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  return {
    encode(bytes) {
      if (bytes.length === 0) return "";
      let digits = [];
      let zeros = 0;
      while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
      for (let i = zeros; i < bytes.length; i++) {
        let carry = bytes[i];
        let j = 0;
        for (; j < digits.length || carry; j++) {
          carry += (digits[j] || 0) << 8;
          digits[j] = carry % 58;
          carry = Math.floor(carry / 58);
        }
      }
      let out = "";
      for (let k = 0; k < zeros; k++) out += ALPHABET[0];
      for (let k = digits.length - 1; k >= 0; k--) out += ALPHABET[digits[k]];
      return out;
    },
    decode(str) {
      if (str.length === 0) return new Uint8Array();
      const bytes = [];
      let zeros = 0;
      while (zeros < str.length && str[zeros] === ALPHABET[0]) zeros++;
      let digits = [];
      for (let i = zeros; i < str.length; i++) {
        let carry = ALPHABET.indexOf(str[i]);
        if (carry === -1) throw new Error("Invalid Base58 character");
        let j = 0;
        for (; j < digits.length || carry; j++) {
          carry += (digits[j] || 0) * 58;
          digits[j] = carry & 0xff;
          carry >>= 8;
        }
      }
      for (let k = 0; k < zeros; k++) bytes.push(0);
      for (let k = digits.length - 1; k >= 0; k--) bytes.push(digits[k]);
      return new Uint8Array(bytes);
    },
  };
})();

const MORSE = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....",
  I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.",
  Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--",
  "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.", "!": "-.-.--",
  "/": "-..-.", "(": "-.--.", ")": "-.--.-", "&": ".-...", ":": "---...",
  ";": "-.-.-.", "=": "-...-", "+": ".-.-.", "-": "-....-", "_": "..--.-",
  '"': ".-..-.", "@": ".--.-.",
};

export const encodingMethods = {
  base64: {
    name: "Base64",
    security: "none",
    badge: "educational",
    description: "Encodes binary data as ASCII. No security — fully reversible by anyone.",
    encode: (str) => {
      const bytes = new TextEncoder().encode(str);
      let bin = "";
      bytes.forEach((b) => (bin += String.fromCharCode(b)));
      return btoa(bin);
    },
    decode: (str) => {
      const bin = atob(str);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    },
  },
  base32: {
    name: "Base32",
    security: "none",
    badge: "educational",
    description: "RFC 4648 Base32. Obfuscation only, not encryption.",
    encode: (str) => base32Encode(new TextEncoder().encode(str)),
    decode: (str) => new TextDecoder().decode(base32Decode(str)),
  },
  base58: {
    name: "Base58",
    security: "none",
    badge: "educational",
    description: "Bitcoin-style Base58. Avoids ambiguous characters. Not encryption.",
    encode: (str) => Base58.encode(new TextEncoder().encode(str)),
    decode: (str) => new TextDecoder().decode(Base58.decode(str)),
  },
  hex: {
    name: "Hexadecimal",
    security: "none",
    badge: "educational",
    description: "Converts bytes to hex pairs. Obfuscation only.",
    encode: (str) => {
      const bytes = new TextEncoder().encode(str);
      return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    },
    decode: (str) => {
      const clean = str.replace(/\s+/g, "");
      const bytes = new Uint8Array(clean.length / 2);
      for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
      return new TextDecoder().decode(bytes);
    },
  },
  url: {
    name: "URL Encode",
    security: "none",
    badge: "educational",
    description: "Percent-encoding for URLs. No security.",
    encode: (str) => encodeURIComponent(str),
    decode: (str) => decodeURIComponent(str.replace(/\+/g, " ")),
  },
  binary: {
    name: "Binary",
    security: "none",
    badge: "educational",
    description: "Represents text as 8-bit binary. Educational only.",
    encode: (str) =>
      new TextEncoder().encode(str)
        .reduce((acc, b) => acc + b.toString(2).padStart(8, "0") + " ", ""),
    decode: (str) => {
      const parts = str.trim().split(/\s+/);
      const bytes = new Uint8Array(parts.length);
      parts.forEach((p, i) => (bytes[i] = parseInt(p, 2)));
      return new TextDecoder().decode(bytes);
    },
  },
  morse: {
    name: "Morse Code",
    security: "none",
    badge: "educational",
    description: "Classic telegraphy encoding. Educational only.",
    encode: (str) =>
      str.toUpperCase().split("").map((c) => (c === " " ? "/" : (MORSE[c] || ""))).filter(Boolean).join(" "),
    decode: (str) =>
      str.split(/\s+/).map((code) => (code === "/" ? " " : Object.keys(MORSE).find((k) => MORSE[k] === code) || "")).join(""),
  },
  xor: {
    name: "XOR (key)",
    security: "weak",
    badge: "educational",
    description: "Simple XOR with a repeating key. Trivially broken — educational only.",
    encode: (str, key) => xorBytes(new TextEncoder().encode(str), key),
    decode: (data, key) => new TextDecoder().decode(xorBytes(data, key)),
  },
};

function xorBytes(bytes, key) {
  const keyBytes = new TextEncoder().encode(key || "");
  if (keyBytes.length === 0) throw new Error("XOR requires a key");
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
  return out;
}

function base32Encode(bytes) {
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0, value = 0, out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  while (out.length % 8 !== 0) out += "=";
  return out;
}

function base32Decode(str) {
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = str.replace(/=+$/g, "").toUpperCase();
  let bits = 0, value = 0;
  const out = [];
  for (const c of clean) {
    const idx = ALPHABET.indexOf(c);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}