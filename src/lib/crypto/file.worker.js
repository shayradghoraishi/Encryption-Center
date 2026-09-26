// Web Worker: chunked AES-256-GCM file encryption/decryption.
// ECV2 format:
// magic(4) || salt(16) || chunkSize(4 LE) || fileSize(8 LE) || chunkCount(4 LE)
// repeated: iv(12) || ciphertextLength(4 LE) || ciphertext+tag
// Each chunk authenticates the header + its chunk index as AAD.

const enc = new TextEncoder();
const CHUNK = 1024 * 1024;
const MAGIC = new Uint8Array([0x45, 0x43, 0x56, 0x32]); // ECV2
const HEADER_SIZE = 4 + 16 + 4 + 8 + 4;

async function deriveKey(password, salt) {
  const km = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" },
    km,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function aadFor(header, index) {
  const aad = new Uint8Array(header.length + 4);
  aad.set(header);
  new DataView(aad.buffer).setUint32(header.length, index, true);
  return aad;
}

function makeHeader(salt, fileSize, chunkCount) {
  const header = new Uint8Array(HEADER_SIZE);
  header.set(MAGIC, 0);
  header.set(salt, 4);
  const view = new DataView(header.buffer);
  view.setUint32(20, CHUNK, true);
  view.setBigUint64(24, BigInt(fileSize), true);
  view.setUint32(32, chunkCount, true);
  return header;
}

function checkMagic(data) {
  if (data.length < HEADER_SIZE) throw new Error("Invalid or truncated encrypted file");
  for (let i = 0; i < MAGIC.length; i++) if (data[i] !== MAGIC[i]) throw new Error("Unsupported encrypted file format");
}

self.onmessage = async (e) => {
  const { type, buffer, password } = e.data;
  try {
    if (!password) throw new Error("Password required");
    const data = new Uint8Array(buffer);

    if (type === "encrypt") {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const chunkCount = Math.ceil(data.length / CHUNK);
      const header = makeHeader(salt, data.length, chunkCount);
      const key = await deriveKey(password, salt);
      const parts = [header];

      for (let index = 0, off = 0; off < data.length; index++, off += CHUNK) {
        const chunk = data.subarray(off, Math.min(off + CHUNK, data.length));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: aadFor(header, index) }, key, chunk));
        const seg = new Uint8Array(16 + ct.length);
        seg.set(iv, 0);
        new DataView(seg.buffer).setUint32(12, ct.length, true);
        seg.set(ct, 16);
        parts.push(seg);
        self.postMessage({ type: "progress", progress: (off + chunk.length) / Math.max(data.length, 1) });
      }
      if (data.length === 0) self.postMessage({ type: "progress", progress: 1 });

      let len = 0; for (const p of parts) len += p.length;
      const out = new Uint8Array(len);
      let cursor = 0; for (const p of parts) { out.set(p, cursor); cursor += p.length; }
      self.postMessage({ type: "done", buffer: out.buffer }, [out.buffer]);
      return;
    }

    if (type !== "decrypt") throw new Error("Unknown worker operation");
    checkMagic(data);
    const salt = data.slice(4, 20);
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const chunkSize = view.getUint32(20, true);
    const fileSize = Number(view.getBigUint64(24, true));
    const chunkCount = view.getUint32(32, true);
    if (chunkSize !== CHUNK || !Number.isSafeInteger(fileSize) || chunkCount !== Math.ceil(fileSize / chunkSize)) throw new Error("Invalid encrypted file header");

    const header = data.slice(0, HEADER_SIZE);
    const key = await deriveKey(password, salt);
    const out = [];
    let offset = HEADER_SIZE;
    let totalPlain = 0;

    for (let index = 0; index < chunkCount; index++) {
      if (offset + 16 > data.length) throw new Error("Corrupted or incomplete encrypted file");
      const iv = data.slice(offset, offset + 12); offset += 12;
      const ctLen = new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(0, true); offset += 4;
      if (ctLen < 16 || offset + ctLen > data.length) throw new Error("Corrupted or incomplete encrypted file");
      const ct = data.slice(offset, offset + ctLen); offset += ctLen;
      const pt = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv, additionalData: aadFor(header, index) }, key, ct));
      totalPlain += pt.length;
      if (index < chunkCount - 1 && pt.length !== chunkSize) throw new Error("Invalid encrypted chunk size");
      out.push(pt);
      self.postMessage({ type: "progress", progress: (index + 1) / Math.max(chunkCount, 1) });
    }

    if (offset !== data.length || totalPlain !== fileSize) throw new Error("Corrupted or incomplete encrypted file");
    let len = 0; for (const p of out) len += p.length;
    const result = new Uint8Array(len);
    let cursor = 0; for (const p of out) { result.set(p, cursor); cursor += p.length; }
    self.postMessage({ type: "done", buffer: result.buffer }, [result.buffer]);
  } catch (err) {
    self.postMessage({ type: "error", message: err instanceof Error ? err.message : String(err) });
  }
};
