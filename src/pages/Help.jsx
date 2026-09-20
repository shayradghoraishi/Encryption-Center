import React from "react";
import { BookOpen, ShieldCheck, AlertTriangle, Lightbulb } from "lucide-react";
import PageHeader, { SecurityNote } from "@/components/PageHeader";
import SecurityBadge from "@/components/SecurityBadge";
import { useI18n } from "@/lib/i18n";

const METHODS = [
  { name: "AES-256-GCM", level: "secure", use: "General-purpose encryption of text and files. Industry standard, hardware-accelerated.", tip: "Use a strong password (12+ chars). The app derives a key with PBKDF2." },
  { name: "ChaCha20-Poly1305", level: "secure", use: "Excellent on mobile and devices without AES hardware. Argon2id KDF.", tip: "A great default when AES hardware is unavailable." },
  { name: "age (X25519 + ChaCha20)", level: "secure", use: "Public-key encryption — encrypt with someone's public key, only they can decrypt.", tip: "Share your public key freely; never share your secret key." },
  { name: "OpenPGP (symmetric)", level: "secure", use: "Passphrase-based, interoperable with GnuPG/PGP tools.", tip: "Use a memorable but strong passphrase." },
  { name: "Cascade Encryption", level: "secure", use: "Multi-layer encryption (Advanced Mode). Decrypting requires all passwords in reverse order.", tip: "Only adds security if each layer uses an independent strong password." },
  { name: "SHA-256 / HMAC", level: "secure", use: "Verify integrity and authenticity of data.", tip: "Use HMAC (with a secret key) to prove a message wasn't tampered with." },
  { name: "Ed25519 Signing", level: "secure", use: "Digitally sign messages/files so recipients can prove you authored them.", tip: "Keep your secret key; share your public key for verification." },
  { name: "Key Vault", level: "secure", use: "Store private keys encrypted with a master password (Advanced Mode).", tip: "Uses AES-256-GCM with a PBKDF2-derived key. Back it up — clearing the browser deletes it." },
  { name: "Base64 / Hex", level: "encoding", use: "Reversible encoding, NOT encryption. For transport/representation only.", tip: "Anyone can decode it. Never use for secrecy." },
  { name: "Classical Ciphers", level: "educational", use: "Caesar, Vigenère, Playfair… historical, broken, for learning only.", tip: "Never use for real secrets. Trivially broken with modern tools." },
  { name: "LSB Image Steganography", level: "educational", use: "Hide data inside PNG pixels. Hides existence, not content.", tip: "Always encrypt the payload first. JPEG destroys hidden data." },
  { name: "Zero-width Text Stego", level: "educational", use: "Hide a message inside text/emojis using invisible characters.", tip: "Fragile — some platforms strip zero-width characters on copy/paste." },
];

const TUTORIALS = [
  { title: "Encrypt your first message", steps: ["Open Text / Code", "Pick AES-256-GCM", "Type your message and a strong password", "Click Encrypt — share the ciphertext + password via separate channels"] },
  { title: "Share a secret with age", steps: ["Generate an age key pair", "Send your public key to the other person", "They encrypt with your public key", "You decrypt with your secret key"] },
  { title: "Verify a file hasn't changed", steps: ["Open Hash Calculator", "Paste the content (or use HMAC with a shared key)", "Share the hash — recompute later to check integrity"] },
];

export default function Help() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader icon={BookOpen} title={t("help.title")} subtitle={t("help.subtitle")} />

      <SecurityNote variant="warn">
        Client-side tools are only as safe as the device running them. Keep your OS and browser updated, avoid shared/public computers for sensitive data, and use strong, unique passwords.
      </SecurityNote>

      <h3 className="mt-8 mb-3 flex items-center gap-2 text-sm font-semibold"><Lightbulb className="h-4 w-4 text-amber-400" /> Quick Tutorials</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {TUTORIALS.map((tu) => (
          <div key={tu.title} className="rounded-xl border border-border p-4">
            <div className="mb-2 text-sm font-semibold">{tu.title}</div>
            <ol className="space-y-1 text-xs text-muted-foreground">
              {tu.steps.map((s, i) => <li key={i} className="flex gap-1.5"><span className="text-emerald-400">{i + 1}.</span><span>{s}</span></li>)}
            </ol>
          </div>
        ))}
      </div>

      <h3 className="mt-8 mb-3 flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Methods & Security Ratings</h3>
      <div className="space-y-2">
        {METHODS.map((m) => (
          <div key={m.name} className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">{m.name}</span>
              <SecurityBadge level={m.level} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{m.use}</p>
            <p className="mt-1.5 flex items-start gap-1.5 text-xs text-foreground/80">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" /> {m.tip}
            </p>
          </div>
        ))}
      </div>

      <SecurityNote variant="info">
        Badge meanings: <strong className="text-emerald-400">Secure</strong> = safe for real use · <strong className="text-amber-400">Educational</strong> = learning only, not for secrets · <strong className="text-sky-400">Encoding</strong> = reversible, not encryption.
      </SecurityNote>
    </div>
  );
}