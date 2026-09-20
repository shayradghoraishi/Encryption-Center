// Web Worker: chunked AES-256-GCM file encryption/decryption with progress.
// Format: "ECV1"(4) || salt(16) || [ iv(12) || ctLen(4 LE) || ciphertext+tag ]...

const enc = new TextEncoder();
const CHUNK = 1024 * 1024; // 1 MB
const MAGIC = [0x45, 0x43, 0x56, 0x31]; // E C V 1

async function deriveKey(password, salt) {
  const km = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" }, km, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

self.onmessage = async (e) => {
  const { type, buffer, password } = e.data;
  const data = new Uint8Array(buffer);
  try {
    if (type === "encrypt") {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await deriveKey(password, salt);
      const parts = [new Uint8Array(MAGIC), salt];
      const total = data.length || 1;
      for (let off = 0; off < data.length; off += CHUNK) {
        const chunk = data.subarray(off, Math.min(off + CHUNK, data.length));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, chunk));
        const seg = new Uint8Array(12 + 4 + ct.length);
        seg.set(iv, 0);
        new DataView(seg.buffer).setUint32(12, ct.length, true);
        seg.set(ct, 16);
        parts.push(seg);
        self.postMessage({ type: "progress", progress: (off + chunk.length) / total });
      }
      let len = 0; for (const p of parts) len += p.length;
      const out = new Uint8Array(len);
      let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
      self.postMessage({ type: "done", buffer: out.buffer }, [out.buffer]);
    } else {
      if (data.length < 20 || data[0] !== 0x45 || data[1] !== 0x43 || data[2] !== 0x56 || data[3] !== 0x31) throw new Error("Invalid encrypted file (bad magic)");
      const salt = data.subarray(4, 20);
      const key = await deriveKey(password, salt);
      const rest = data.subarray(20);
      const total = rest.length || 1;
      const out = [];
      let offset = 0;
      while (offset < rest.length) {
        const iv = rest.subarray(offset, offset + 12); offset += 12;
        if (offset + 4 > rest.length) throw new Error("Corrupted file");
        const ctLen = new DataView(rest.buffer, rest.byteOffset + offset, 4).getUint32(0, true); offset += 4;
        const ct = rest.subarray(offset, offset + ctLen); offset += ctLen;
        const pt = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct));
        out.push(pt);
        self.postMessage({ type: "progress", progress: offset / total });
      }
      let len = 0; for (const p of out) len += p.length;
      const result = new Uint8Array(len);
      let o = 0; for (const p of out) { result.set(p, o); o += p.length; }
      self.postMessage({ type: "done", buffer: result.buffer }, [result.buffer]);
    }
  } catch (err) {
    self.postMessage({ type: "error", message: err.message });
  }
};