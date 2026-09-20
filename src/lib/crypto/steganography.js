// LSB (Least Significant Bit) image steganography using Canvas.
// Hides arbitrary bytes (text or files) in the RGB channels of a PNG image.
// Header: 4 bytes magic "STG1" || 4 bytes payload length (uint32 big-endian) || payload bytes

const MAGIC = "STG1";

export async function embedData(imageFile, payload) {
  const img = await loadImage(imageFile);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const payloadBytes = payload instanceof Uint8Array ? payload : new TextEncoder().encode(payload);
  const header = new Uint8Array(8);
  for (let i = 0; i < 4; i++) header[i] = MAGIC.charCodeAt(i);
  const view = new DataView(header.buffer);
  view.setUint32(4, payloadBytes.length);
  const full = new Uint8Array(header.length + payloadBytes.length);
  full.set(header, 0);
  full.set(payloadBytes, header.length);

  const capacity = Math.floor((data.length / 4) * 3 / 8);
  if (full.length > capacity) {
    throw new Error(`Payload too large. Max capacity: ${formatBytes(capacity)}, payload: ${formatBytes(full.length)}`);
  }

  let bitIndex = 0;
  for (let i = 0; i < full.length * 8; i++) {
    const byte = full[Math.floor(i / 8)];
    const bit = (byte >> (7 - (i % 8))) & 1;
    // skip alpha channel (every 4th byte)
    const pixelIndex = i + Math.floor(i / 3);
    data[pixelIndex] = (data[pixelIndex] & 0xfe) | bit;
  }

  ctx.putImageData(imageData, 0, 0);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

export async function extractData(imageFile) {
  const img = await loadImage(imageFile);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  const headerBits = 8 * 8;
  const headerBytes = readBits(data, 0, headerBits);
  let magic = "";
  for (let i = 0; i < 4; i++) magic += String.fromCharCode(headerBytes[i]);
  if (magic !== MAGIC) throw new Error("No hidden data found (invalid magic header).");

  const view = new DataView(headerBytes.buffer);
  const payloadLen = view.getUint32(4);
  if (payloadLen > data.length) throw new Error("Corrupted payload header.");

  const payloadBytes = readBits(data, headerBits, payloadLen * 8);
  return payloadBytes;
}

function readBits(data, startBit, bitCount) {
  const byteCount = bitCount / 8;
  const out = new Uint8Array(byteCount);
  for (let i = 0; i < bitCount; i++) {
    const pixelIndex = startBit + i + Math.floor((startBit + i) / 3);
    const bit = data[pixelIndex] & 1;
    out[Math.floor(i / 8)] |= bit << (7 - (i % 8));
  }
  return out;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function getImageCapacity(imageFile) {
  return loadImage(imageFile).then((img) => {
    const pixels = img.width * img.height;
    const bytes = Math.floor((pixels * 3) / 8) - 8; // minus header
    return formatBytes(Math.max(0, bytes));
  });
}