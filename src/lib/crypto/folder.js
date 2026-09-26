// Lightweight local folder container. It is intentionally NOT a general ZIP implementation.
// The container is packed first, then encrypted by the existing ECV2 file format.

const MAGIC = new Uint8Array([0x45, 0x43, 0x46, 0x31]); // ECF1
const enc = new TextEncoder();
const dec = new TextDecoder();

function u32(n) { const a = new Uint8Array(4); new DataView(a.buffer).setUint32(0, n, true); return a; }
function readU32(bytes, off) { return new DataView(bytes.buffer, bytes.byteOffset + off, 4).getUint32(0, true); }

export async function packFolderFiles(files) {
  const entries = [];
  const chunks = [];
  let total = 0;
  for (const file of files) {
    const path = file.webkitRelativePath || file.relativePath || file.name;
    if (!path || path.length > 4096) throw new Error("Invalid folder entry path");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const meta = { path, size: bytes.length, type: file.type || "application/octet-stream", lastModified: Number(file.lastModified) || 0 };
    const json = enc.encode(JSON.stringify(meta));
    if (json.length > 1024 * 1024) throw new Error("Folder entry metadata is too large");
    entries.push(meta);
    chunks.push(u32(json.length), json, u32(bytes.length), bytes);
    total += 8 + json.length + bytes.length;
  }
  const header = new Uint8Array(MAGIC.length + 4);
  header.set(MAGIC);
  new DataView(header.buffer).setUint32(4, entries.length, true);
  const out = new Uint8Array(header.length + total);
  out.set(header);
  let cursor = header.length;
  for (const c of chunks) { out.set(c, cursor); cursor += c.length; }
  return out;
}

export async function unpackFolderBytes(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 8) throw new Error("Invalid folder container");
  for (let i = 0; i < 4; i++) if (bytes[i] !== MAGIC[i]) throw new Error("Unsupported folder container");
  const count = readU32(bytes, 4);
  if (count > 100000) throw new Error("Folder contains too many entries");
  let off = 8;
  const files = [];
  for (let i = 0; i < count; i++) {
    if (off + 4 > bytes.length) throw new Error("Truncated folder container");
    const metaLen = readU32(bytes, off); off += 4;
    if (metaLen < 2 || metaLen > 1024 * 1024 || off + metaLen > bytes.length) throw new Error("Invalid folder metadata");
    let meta;
    try { meta = JSON.parse(dec.decode(bytes.slice(off, off + metaLen))); } catch { throw new Error("Invalid folder metadata JSON"); }
    off += metaLen;
    if (off + 4 > bytes.length) throw new Error("Truncated folder container");
    const size = readU32(bytes, off); off += 4;
    if (!Number.isSafeInteger(size) || off + size > bytes.length) throw new Error("Invalid folder entry size");
    if (typeof meta.path !== "string" || !meta.path || meta.path.includes("\\") || meta.path.split("/").includes("..") || meta.path.startsWith("/")) throw new Error("Unsafe folder path");
    files.push({ name: meta.path.split("/").pop() || "file", path: meta.path, type: meta.type || "application/octet-stream", lastModified: meta.lastModified || 0, bytes: bytes.slice(off, off + size) });
    off += size;
  }
  if (off !== bytes.length) throw new Error("Unexpected data after folder container");
  return files;
}
