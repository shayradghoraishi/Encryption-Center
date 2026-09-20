# Encryption Center

A premium, fully client-side cryptography suite. Encrypt and decrypt text, code, and files using modern audited algorithms, classical ciphers, encoding formats, and LSB image steganography — all in your browser. Nothing is ever sent to a server.

## Features

### Secure / Recommended
- **AES-256-GCM** — Web Crypto API with PBKDF2 key derivation
- **ChaCha20-Poly1305** — `@noble/ciphers` with Argon2id
- **age (X25519 + ChaCha20)** — public-key encryption
- **OpenPGP** — hybrid encryption compatible with GnuPG

### Classical / Educational
Caesar, ROT13, ROT47, Atbash, Vigenère, Affine, Playfair, Rail Fence, Columnar Transposition, Simple Substitution, Baconian, Polybius Square, and more.

### Encoding / Obfuscation
Base64, Base32, Base58, Hex, URL Encode, Binary, Morse Code, XOR.

### Other Tools
- LSB image steganography
- Key management (RSA, ECDSA, Ed25519, OpenPGP)
- Secure local Key Vault
- Password generator + strength meter
- Hash calculator (SHA family + HMAC)
- Help & Learning Center
- English UI
- Source/programming language label for text/code encryption (download filenames)
- Dark / light theme
- Simple / Advanced mode toggle
- Donate section

## Security Notes

- Classical ciphers and simple encodings are for learning only — they provide no real security.
- Prefer **AES-256-GCM** or **ChaCha20-Poly1305** for real protection.
- Client-side encryption is only as secure as the device running it.
- Use strong, unique passwords and keep your software updated.
- Never share private keys. Store them in a password manager or hardware key when possible.

## Tech Stack

- React + Vite + Tailwind CSS + shadcn/ui
- Web Crypto API for AES-GCM, RSA, ECDSA, PBKDF2
- `@noble/ciphers` for ChaCha20-Poly1305
- `hash-wasm` for Argon2id
- `tweetnacl` for X25519 / Ed25519
- `openpgp` for OpenPGP

AES, ChaCha20, and RSA are **never** implemented from scratch — only audited libraries and the native Web Crypto API are used.

## Run Locally

```bash
npm install
npm run dev
```

Open the printed local URL (usually http://localhost:5173) in your browser.

## Build for Production

```bash
npm run build
```

The output will be in the `dist/` folder. Serve it with any static file server over HTTPS.

## License

This project is provided as-is for educational and practical use. Use responsibly.

## Author

[github.com/shayradghoraishi](https://github.com/shayradghoraishi)
