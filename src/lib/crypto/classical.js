// Classical ciphers — educational only. None of these provide real security.

function mod(n, m) {
  return ((n % m) + m) % m;
}

export const classicalCiphers = {
  caesar: {
    name: "Caesar",
    security: "weak",
    badge: "educational",
    description: "Shifts each letter by a fixed number (key). Broken by brute force in 25 tries.",
    needsKey: "number",
    encrypt: (text, key) => shift(text, parseInt(key) || 0),
    decrypt: (text, key) => shift(text, -(parseInt(key) || 0)),
  },
  rot13: {
    name: "ROT13",
    security: "weak",
    badge: "educational",
    description: "Caesar with shift 13 — its own inverse. Obfuscation only.",
    encrypt: (text) => shift(text, 13),
    decrypt: (text) => shift(text, 13),
  },
  rot47: {
    name: "ROT47",
    security: "weak",
    badge: "educational",
    description: "Rotates ASCII printable chars (33–126). Obfuscation only.",
    encrypt: (text) => rot47(text),
    decrypt: (text) => rot47(text),
  },
  atbash: {
    name: "Atbash",
    security: "weak",
    badge: "educational",
    description: "Reverses the alphabet. Ancient, trivially broken.",
    encrypt: (text) => atbash(text),
    decrypt: (text) => atbash(text),
  },
  vigenere: {
    name: "Vigenère",
    security: "weak",
    badge: "educational",
    description: "Polyalphabetic substitution with a keyword. Broken by frequency analysis.",
    needsKey: "text",
    encrypt: (text, key) => vigenere(text, key, false),
    decrypt: (text, key) => vigenere(text, key, true),
  },
  affine: {
    name: "Affine",
    security: "weak",
    badge: "educational",
    description: "y = ax + b mod 26. Requires coprime key 'a'.",
    needsKey: "affine",
    encrypt: (text, key) => affine(text, key, false),
    decrypt: (text, key) => affine(text, key, true),
  },
  playfair: {
    name: "Playfair",
    security: "weak",
    badge: "educational",
    description: "5x5 matrix digraph cipher. Broken by bigram frequency analysis.",
    needsKey: "text",
    encrypt: (text, key) => playfair(text, key, false),
    decrypt: (text, key) => playfair(text, key, true),
  },
  railfence: {
    name: "Rail Fence",
    security: "weak",
    badge: "educational",
    description: "Transposition cipher writing in zig-zag rails.",
    needsKey: "number",
    encrypt: (text, key) => railFenceEncrypt(text, parseInt(key) || 2),
    decrypt: (text, key) => railFenceDecrypt(text, parseInt(key) || 2),
  },
  columnar: {
    name: "Columnar Transposition",
    security: "weak",
    badge: "educational",
    description: "Writes text in rows, reads columns by key order.",
    needsKey: "text",
    encrypt: (text, key) => columnarEncrypt(text, key),
    decrypt: (text, key) => columnarDecrypt(text, key),
  },
  substitution: {
    name: "Simple Substitution",
    security: "weak",
    badge: "educational",
    description: "Maps each letter via a 26-letter key alphabet.",
    needsKey: "text",
    encrypt: (text, key) => substitution(text, key, false),
    decrypt: (text, key) => substitution(text, key, true),
  },
  baconian: {
    name: "Baconian",
    security: "weak",
    badge: "educational",
    description: "Represents letters as 5-bit A/B sequences.",
    encrypt: (text) => baconianEncrypt(text),
    decrypt: (text) => baconianDecrypt(text),
  },
  polybius: {
    name: "Polybius Square",
    security: "weak",
    badge: "educational",
    description: "Maps letters to 2-digit grid coordinates.",
    encrypt: (text) => polybiusEncrypt(text),
    decrypt: (text) => polybiusDecrypt(text),
  },
};

function shift(text, n) {
  return text.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(mod(c.charCodeAt(0) - base + n, 26) + base);
  });
}

function rot47(text) {
  return text.replace(/[\x21-\x7E]/g, (c) => {
    const code = c.charCodeAt(0);
    return String.fromCharCode(((code - 33 + 47) % 94) + 33);
  });
}

function atbash(text) {
  return text.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(base + 25 - (c.charCodeAt(0) - base));
  });
}

function vigenere(text, key, decrypt) {
  const k = (key || "").toUpperCase().replace(/[^A-Z]/g, "");
  if (!k.length) throw new Error("Vigenère requires an alphabetic key");
  let ki = 0;
  return text.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    const shift = k.charCodeAt(ki % k.length) - 65;
    ki++;
    const s = decrypt ? -shift : shift;
    return String.fromCharCode(mod(c.charCodeAt(0) - base + s, 26) + base);
  });
}

function affine(text, key, decrypt) {
  const [a, b] = (key || "5,8").split(",").map((x) => parseInt(x.trim()));
  if (!a || !Number.isInteger(b)) throw new Error("Affine key format: a,b (e.g. 5,8)");
  if (gcd(a, 26) !== 1) throw new Error("Affine 'a' must be coprime with 26");
  const aInv = modInverse(a, 26);
  return text.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    const x = c.charCodeAt(0) - base;
    const y = decrypt ? mod(aInv * (x - b), 26) : mod(a * x + b, 26);
    return String.fromCharCode(y + base);
  });
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}
function modInverse(a, m) {
  for (let x = 1; x < m; x++) if ((a * x) % m === 1) return x;
  throw new Error("No modular inverse");
}

function playfair(text, key, decrypt) {
  const matrix = buildPlayfairMatrix((key || "KEY").toUpperCase());
  const clean = text.toUpperCase().replace(/[^A-Z]/g, "").replace(/J/g, "I");
  const pairs = [];
  for (let i = 0; i < clean.length;) {
    const a = clean[i];
    const b = clean[i + 1];
    if (!b) { pairs.push([a, "X"]); break; }
    if (a === b) { pairs.push([a, "X"]); i += 1; }
    else { pairs.push([a, b]); i += 2; }
  }
  return pairs.map(([a, b]) => playfairPair(matrix, a, b, decrypt)).join("");
}

function buildPlayfairMatrix(key) {
  const seen = new Set();
  let letters = "";
  for (const c of (key + "ABCDEFGHIKLMNOPQRSTUVWXYZ")) {
    if (!seen.has(c)) {
      seen.add(c);
      letters += c;
    }
  }
  const matrix = [];
  for (let i = 0; i < 5; i++) matrix.push(letters.slice(i * 5, i * 5 + 5).split(""));
  return matrix;
}

function playfairPair(matrix, a, b, decrypt) {
  let [ra, ca] = findPos(matrix, a);
  let [rb, cb] = findPos(matrix, b);
  const shift = decrypt ? -1 : 1;
  if (ra === rb) return matrix[ra][mod(ca + shift, 5)] + matrix[rb][mod(cb + shift, 5)];
  if (ca === cb) return matrix[mod(ra + shift, 5)][ca] + matrix[mod(rb + shift, 5)][cb];
  return matrix[ra][cb] + matrix[rb][ca];
}

function findPos(matrix, c) {
  for (let r = 0; r < 5; r++) for (let col = 0; col < 5; col++) if (matrix[r][col] === c) return [r, col];
}

function railFenceEncrypt(text, rails) {
  if (rails < 2) return text;
  const fence = Array.from({ length: rails }, () => []);
  let rail = 0, dir = 1;
  for (const c of text) {
    fence[rail].push(c);
    if (rail === 0) dir = 1;
    else if (rail === rails - 1) dir = -1;
    rail += dir;
  }
  return fence.flat().join("");
}

function railFenceDecrypt(text, rails) {
  if (rails < 2) return text;
  const cycle = 2 * (rails - 1);
  const lengths = Array(rails).fill(0);
  for (let i = 0; i < text.length; i++) {
    let pos = i % cycle;
    lengths[pos < rails ? pos : cycle - pos]++;
  }
  const fence = lengths.map((l) => text.slice(0, l).split(""));
  let idx = 0;
  const sliced = fence.map((f) => { const s = text.slice(idx, idx + f.length).split(""); idx += f.length; return s; });
  let result = "", rail = 0, dir = 1, k = 0;
  for (let i = 0; i < text.length; i++) {
    result += sliced[rail].shift();
    if (rail === 0) dir = 1;
    else if (rail === rails - 1) dir = -1;
    rail += dir;
  }
  return result;
}

function columnarEncrypt(text, key) {
  const k = (key || "KEY").toUpperCase().replace(/[^A-Z]/g, "");
  if (!k.length) throw new Error("Columnar requires a key");
  const order = getColumnOrder(k);
  const cols = k.length;
  const rows = Math.ceil(text.length / cols);
  const grid = Array.from({ length: rows }, (_, r) => text.slice(r * cols, r * cols + cols).split(""));
  let out = "";
  order.forEach((col) => {
    for (let r = 0; r < rows; r++) if (grid[r][col]) out += grid[r][col];
  });
  return out;
}

function columnarDecrypt(text, key) {
  const k = (key || "KEY").toUpperCase().replace(/[^A-Z]/g, "");
  if (!k.length) throw new Error("Columnar requires a key");
  const order = getColumnOrder(k);
  const cols = k.length;
  const rows = Math.ceil(text.length / cols);
  const fullCols = text.length % cols === 0 ? cols : text.length % cols;
  const colLens = Array(cols).fill(rows);
  for (let i = 0; i < cols - fullCols; i++) colLens[order[cols - 1 - i]]--;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(""));
  let idx = 0;
  order.forEach((col) => {
    for (let r = 0; r < colLens[col]; r++) grid[r][col] = text[idx++];
  });
  return grid.flat().join("");
}

function getColumnOrder(key) {
  const indexed = key.split("").map((c, i) => [c, i]);
  return indexed.sort((a, b) => a[0].localeCompare(b[0])).map((x) => x[1]);
}

function substitution(text, key, decrypt) {
  const k = (key || "").toUpperCase().replace(/[^A-Z]/g, "");
  if (k.length !== 26 || new Set(k).size !== 26) throw new Error("Substitution key must contain 26 unique letters");
  const plain = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const cipher = k;
  return text.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    const up = c.toUpperCase();
    const src = decrypt ? cipher : plain;
    const dst = decrypt ? plain : cipher;
    const idx = src.indexOf(up);
    const sub = dst[idx];
    return c <= "Z" ? sub : sub.toLowerCase();
  });
}

function baconianEncrypt(text) {
  return text.toUpperCase().replace(/[^A-Z]/g, "").split("").map((c) => {
    const n = c.charCodeAt(0) - 65;
    return n.toString(2).padStart(5, "0").replace(/0/g, "A").replace(/1/g, "B");
  }).join(" ");
}

function baconianDecrypt(text) {
  const clean = text.toUpperCase().replace(/[^AB]/g, "");
  if (!clean) return "";
  if (clean.length % 5 !== 0) throw new Error("Baconian input must contain complete 5-symbol groups");
  return (clean.match(/.{5}/g) || []).map((group) => {
    const value = Number.parseInt(group.replace(/A/g, "0").replace(/B/g, "1"), 2);
    if (value > 25) throw new Error("Invalid Baconian group");
    return String.fromCharCode(value + 65);
  }).join("");
}

function polybiusEncrypt(text) {
  return text.toUpperCase().replace(/[^A-Z]/g, "").replace(/J/g, "I").split("").map((c) => {
    const n = c.charCodeAt(0) - 65 - (c > "J" ? 1 : 0);
    const row = Math.floor(n / 5) + 1, col = (n % 5) + 1;
    return `${row}${col}`;
  }).join(" ");
}

function polybiusDecrypt(text) {
  return (text.replace(/[^0-9]/g, "").match(/.{1,2}/g) || []).map((pair) => {
    const row = parseInt(pair[0]) - 1, col = parseInt(pair[1]) - 1;
    const n = row * 5 + col;
    return String.fromCharCode(n + 65 + (n >= 9 ? 1 : 0));
  }).join("");
}