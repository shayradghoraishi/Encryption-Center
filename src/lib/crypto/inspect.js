const ECV2_MAGIC = [0x45, 0x43, 0x56, 0x32];
const ECV2_HEADER = 36;
const enc = new TextEncoder();

function magic(bytes, expected) { return expected.every((v, i) => bytes[i] === v); }
function hex(bytes, max = 16) { return Array.from(bytes.slice(0, max), b => b.toString(16).padStart(2, "0")).join(""); }

export function inspectEcv2(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new Error("Expected binary data");
  if (bytes.length < ECV2_HEADER) throw new Error("File is too small to be a valid ECV2 file");
  if (!magic(bytes, ECV2_MAGIC)) throw new Error("Unsupported format (expected ECV2)");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const salt = bytes.slice(4, 20);
  const chunkSize = view.getUint32(20, true);
  const fileSizeBig = view.getBigUint64(24, true);
  const chunkCount = view.getUint32(32, true);
  const fileSize = Number(fileSizeBig);
  if (!Number.isSafeInteger(fileSize)) throw new Error("Declared plaintext size exceeds JavaScript safe integer range");
  if (chunkSize !== 1024 * 1024) throw new Error("Unsupported ECV2 chunk size");
  if (chunkCount !== Math.ceil(fileSize / chunkSize)) throw new Error("Invalid chunk count");
  let offset = ECV2_HEADER;
  let totalCipher = 0;
  const chunks = [];
  for (let i = 0; i < chunkCount; i++) {
    if (offset + 16 > bytes.length) throw new Error(`Truncated before chunk ${i}`);
    const iv = bytes.slice(offset, offset + 12); offset += 12;
    const ctLen = view.getUint32(offset, true); offset += 4;
    if (ctLen < 16 || offset + ctLen > bytes.length) throw new Error(`Invalid chunk ${i} length`);
    offset += ctLen;
    totalCipher += ctLen;
    chunks.push({ index: i, iv: hex(iv), ciphertextBytes: ctLen, authenticated: true });
  }
  const validLength = offset === bytes.length;
  return {
    validStructure: validLength,
    format: "ECV2",
    algorithm: "AES-256-GCM",
    kdf: "PBKDF2-HMAC-SHA-256 (250,000 iterations)",
    chunkSize,
    plaintextBytes: fileSize,
    chunkCount,
    ciphertextBytes: totalCipher,
    overheadBytes: bytes.length - fileSize,
    saltPreview: hex(salt),
    chunks: chunks.slice(0, 50),
    moreChunks: chunks.length > 50,
    byteLength: bytes.length,
  };
}

export function detectFormat(bytes) {
  if (!(bytes instanceof Uint8Array)) return "unknown";
  if (bytes.length >= 4 && magic(bytes, ECV2_MAGIC)) return "ECV2";
  const ascii = new TextDecoder().decode(bytes.slice(0, Math.min(bytes.length, 64)));
  if (ascii.startsWith("EC-A1")) return "EC-A1";
  return "unknown";
}

export const inspectorConstants = { ECV2_HEADER, ECV2_MAGIC, enc };
