import React, { useEffect, useRef } from "react";
import QRCode from "qrcode";

// Renders a QR code to a canvas. Falls back gracefully if the value is empty.
export default function QrCode({ value, size = 180, className }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!value || !ref.current) return;
    QRCode.toCanvas(ref.current, value, { width: size, margin: 1, color: { dark: "#0a0a0a", light: "#ffffff" } }, () => {});
  }, [value, size]);
  if (!value) return null;
  return <canvas ref={ref} className={className} />;
}