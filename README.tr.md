# Encryption Center — Türkçe

<p align="center"><img src="public/logo.png" width="180" alt="Encryption Center logo" /></p>


![Encryption Center](docs/screenshots/overview.svg)

Tarayıcı ve masaüstü için **local-first**, açık kaynaklı bir kriptografi araç seti.

AES-256-GCM, ChaCha20-Poly1305, PBKDF2, Argon2id, dosya/klasör şifreleme, SHA/SHA-3/BLAKE hashleri, HMAC, Ed25519 imzaları, anahtar yönetimi, Key Vault, ECV2 Inspector, Security Check, PWA, GitHub Pages, Cloudflare Workers, Electron/EXE ve CLI içerir.

**Diller:** [English](README.md) · [فارسی](README.fa.md) · [Español](README.es.md) · [Türkçe](README.tr.md)

## Ekran görüntüleri

![Genel görünüm](docs/screenshots/overview.svg)

![Güvenlik](docs/screenshots/security.svg)

## Yerel çalıştırma

Node.js 22+ ve npm 10+ gerekir.

```bash
git clone https://github.com/shayradghoraishi/encryption-center.git
cd encryption-center
npm ci
npm run dev
```

Kontrol/build:

```bash
npm run check
npm run build
```

## GitHub Pages

Proje `HashRouter` ve relative asset yolları kullanır. GitHub'da **Settings → Pages → GitHub Actions** seçeneğini etkinleştirin.

## Cloudflare Workers

```bash
npm run cf:preview
npm run cf:deploy
```

## EXE

```bash
npm run build
npm run desktop:install
npm run desktop:build
```

## CLI

```bash
node cli/encryption-center.mjs encrypt dosya.pdf dosya.pdf.enc
node cli/encryption-center.mjs decrypt dosya.pdf.enc dosya.pdf
node cli/encryption-center.mjs hash dosya.pdf sha256
node cli/encryption-center.mjs inspect dosya.pdf.enc
```

Güvenlik modeli, ECV2 formatı, proje yapısı ve yayınlama rehberi için [tam İngilizce README](README.md) dosyasına bakın.

## Lisans

MIT — [LICENSE](LICENSE).
