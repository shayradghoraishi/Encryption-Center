import React, { createContext, useContext, useCallback } from "react";

const dict = {
    brand: "Encryption Center",
    brandTag: "Client-side crypto suite",
    nav: {
      text: "Text / Code",
      encoding: "Encoding",
      classical: "Classical Ciphers",
      files: "File Encryption",
      steganography: "Steganography",
      passwords: "Password Generator",
      hashes: "Hash Calculator",
      keys: "Key Management",
      settings: "Settings",
      help: "Help Center",
      donate: "Donate",
      vault: "Key Vault",
    },
    theme: {
      light: "Light mode",
      dark: "Dark mode",
    },
    mode: {
      simple: "Simple",
      advanced: "Advanced",
    },
    common: {
      encrypt: "Encrypt",
      decrypt: "Decrypt",
      copy: "Copy",
      download: "Download",
      clear: "Clear",
      generate: "Generate",
      password: "Password",
      input: "Input",
      output: "Output",
      loading: "Processing…",
      success: "Success",
      error: "Error",
      required: "Required",
      optional: "Optional",
      save: "Save",
      cancel: "Cancel",
      search: "Search",
      export: "Export",
      import: "Import",
      delete: "Delete",
      close: "Close",
      advanced: "Advanced",
      simple: "Simple",
      secure: "Secure",
      educational: "Educational",
      encoding: "Encoding",
      nothing: "Nothing to process",
      enterText: "Enter some text first.",
      passwordRequired: "Password required",
      operationFailed: "Operation failed",
      encrypted: "Encrypted successfully",
      decrypted: "Decrypted successfully",
      copied: "Copied to clipboard",
      theme: "Theme",
      language: "Language",
      history: "History",
      clearHistory: "Clear history",
      noHistory: "No history yet.",
      defaultMethod: "Default method",
      securityReminder: "Client-side encryption is only as secure as the device running it. Use strong, unique passwords and keep your software updated.",
      decryptedText: "Decrypted text",
      showQr: "Show QR",
      hideQr: "Hide QR",
      qrTooLarge: "Output too large for a QR code.",
      generatePair: "Generate pair",
      addLayer: "Add layer",
      layer: "Layer",
      scanQr: "Scan QR into input",
      recipientPub: "Recipient public key (to encrypt)",
      yourSecret: "Your secret key (to decrypt)",
      layersLabel: "Layers (encrypt top→bottom)",
      layersHint: "Decryption applies layers in reverse order with the same passwords.",
      codeLang: "Source language",
      codeLangHint: "Optional — labels your code; does not change encryption.",
      hide: "Hide",
      show: "Show",
      passwordPh: "Enter password…",
    },
    text: {
      title: "Text / Code Encryption",
      subtitle: "Encrypt and decrypt text using modern, audited algorithms.",
      note: "All processing happens in your browser. Nothing is sent to any server. For real protection prefer AES-256-GCM or ChaCha20-Poly1305.",
      plaintext: "Plaintext",
      ciphertext: "Ciphertext",
      runEncrypt: "Encrypt",
      runDecrypt: "Decrypt",
    },
    files: {
      title: "File Encryption",
      subtitle: "Encrypt and decrypt any file entirely in your browser.",
    },
    encoding: {
      title: "Encoding & Obfuscation",
      subtitle: "Encode and decode text. These are not encryption.",
    },
    classical: {
      title: "Classical Ciphers",
      subtitle: "Historical ciphers for learning only. Not secure.",
    },
    stego: {
      title: "Steganography",
      subtitle: "Hide data inside images. Always encrypt first.",
    },
    keys: {
      title: "Key Management",
      subtitle: "Generate and manage cryptographic keys.",
    },
    settings: {
      title: "Settings",
      subtitle: "Theme, language, history and preferences.",
      appearance: "Appearance",
      preferences: "Preferences",
      historyTitle: "Operation History",
      backup: "Session Backup",
    },
    passwords: {
      title: "Password Generator",
      subtitle: "Generate strong random passwords and passphrases.",
    },
    hashes: {
      title: "Hash Calculator",
      subtitle: "Compute SHA digests and HMAC for integrity verification.",
    },
    help: {
      title: "Help & Learning Center",
      subtitle: "Understand every method, when to use it, and how to stay safe.",
    },
    donate: {
      title: "Support this Project",
      subtitle: "If this tool helps you, consider donating. Addresses below.",
    },
    vault: {
      title: "Key Vault",
      subtitle: "Store private keys encrypted with a master password. Stays in your browser.",
    },
    pg: {
      title: "Password Generator",
      subtitle: "Generate strong random passwords and passphrases.",
    },
    hc: {
      title: "Hash Calculator",
      subtitle: "Compute SHA digests and HMAC for integrity verification.",
    },
  };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const t = useCallback((key) => {
    const parts = key.split(".");
    let v = dict;
    for (const p of parts) {
      v = v?.[p];
      if (v == null) return key;
    }
    return v == null ? key : v;
  }, []);
  return (
    <LanguageContext.Provider value={{ lang: "en", setLang: () => {}, dir: "ltr", t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) return { lang: "en", setLang: () => {}, dir: "ltr", t: (k) => k };
  return ctx;
}
