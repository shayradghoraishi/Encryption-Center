import React, { useRef } from "react";
import jsQR from "jsqr";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

// Scan a QR code from a local image file; calls onScan(decodedText).
export default function QrScanner({ onScan, label = "Scan QR" }) {
  const ref = useRef(null);
  const { toast } = useToast();

  const handle = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const url = URL.createObjectURL(f);
      const img = document.createElement("img");
      img.src = url;
      await new Promise((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("Cannot read image")); });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const res = jsQR(imageData.data, imageData.width, imageData.height);
      if (res?.data) { onScan(res.data); toast({ title: "QR scanned" }); }
      else toast({ title: "No QR code found in image", variant: "destructive" });
    } catch (err) {
      toast({ title: "Scan failed", description: err.message, variant: "destructive" });
    } finally {
      e.target.value = "";
    }
  };

  return (
    <>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handle} />
      <Button variant="outline" size="sm" onClick={() => ref.current?.click()} className="gap-1.5">
        <ScanLine className="h-3.5 w-3.5" /> {label}
      </Button>
    </>
  );
}