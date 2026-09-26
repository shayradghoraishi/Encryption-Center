# Encryption Center — مرکز رمزنگاری

<p align="center"><img src="public/logo.png" width="180" alt="Encryption Center logo" /></p>


![Encryption Center](docs/screenshots/overview.svg)

**یک مجموعه ابزار رمزنگاری متن‌باز، محلی و مناسب وب و دسکتاپ.**

Encryption Center رمزنگاری احرازاصالت‌شده، حفاظت از فایل و پوشه، هش، امضای دیجیتال، مدیریت کلید، نهان‌نگاری، تولید رمز عبور، بازرسی فایل و بررسی محیط امنیتی را در یک رابط واحد جمع می‌کند.

**زبان‌ها:** [English](README.md) · [فارسی](README.fa.md) · [Español](README.es.md) · [Türkçe](README.tr.md)

---

## ✨ قابلیت‌ها

- AES-256-GCM و ChaCha20-Poly1305
- Argon2id و PBKDF2
- فرمت فایل نسخه‌بندی‌شده ECV2 با احراز اصالت هر chunk
- رمزنگاری چند فایل و پوشه
- کانتینر ECF1 برای نگهداری ساختار پوشه
- SHA-1، SHA-2، SHA-3، BLAKE2b و BLAKE3
- HMAC و مقایسه digest
- امضای دیجیتال Ed25519 برای متن و فایل
- تولید کلید RSA، ECDSA، Ed25519 و OpenPGP
- Key Vault محلی و رمزنگاری‌شده
- Password/Passphrase Generator
- File Inspector
- Security Check
- Privacy Dashboard
- Steganography، Encoding و Classical Ciphers آموزشی
- PWA و حالت آفلاین
- GitHub Pages و Cloudflare Workers
- نسخه دسکتاپ Electron و ساخت EXE
- CLI برای رمزنگاری، رمزگشایی، هش و بررسی ECV2
- رابط انگلیسی و فارسی با پشتیبانی کامل RTL

---

## 🖼️ تصاویر

### دسکتاپ

![نمای دسکتاپ](docs/screenshots/overview.svg)

### ابزارهای امنیتی

![ابزارهای امنیتی](docs/screenshots/security.svg)

### موبایل

![نمای موبایل](docs/screenshots/mobile.svg)

---

## 🔐 مدل امنیتی

عملیات رمزنگاری Encryption Center به‌صورت **local-first** طراحی شده‌اند. برای رمزنگاری نیازی به سرور ندارید و داده خام نباید برای انجام عملیات رمزنگاری به backend ارسال شود.

فرمت ECV2 شامل header، salt، اندازه chunk و اندازه فایل است و برای هر chunk یک nonce و ciphertext احرازاصالت‌شده نگه می‌دارد. header و شماره chunk نیز به‌عنوان AAD استفاده می‌شوند تا جابه‌جایی ساده chunkها قابل تشخیص باشد.

> این پروژه ادعای «غیرقابل شکستن بودن» یا «پاک شدن تضمینی RAM» ندارد. امنیت واقعی به دستگاه، سیستم‌عامل، مرورگر، افزونه‌ها و روش استفاده شما هم وابسته است.

---

## 🚀 اجرای محلی

نیازمندی‌ها:

- Node.js 22+
- npm 10+
- مرورگر مدرن با Web Crypto

```bash
git clone https://github.com/shayradghoraishi/encryption-center.git
cd encryption-center
npm ci
npm run dev
```

برای build و بررسی:

```bash
npm run check
npm run build
npm run preview
```

---

## 🌐 GitHub Pages

پروژه از `HashRouter` و مسیرهای نسبی Vite استفاده می‌کند تا در repository page بدون نیاز به rewrite سمت سرور کار کند.

در GitHub مسیر **Settings → Pages → GitHub Actions** را فعال کنید. Workflow در این مسیر است:

```text
.github/workflows/deploy-pages.yml
```

---

## ☁️ Cloudflare Workers

```bash
npm run cf:preview
npm run cf:deploy
```

تنظیمات در `wrangler.jsonc` قرار دارد. Worker فقط فایل‌های build شده را سرو می‌کند و عملیات رمزنگاری در سمت کاربر انجام می‌شود.

---

## 🖥️ ساخت EXE

```bash
npm run build
npm run desktop:install
npm run desktop:start
npm run desktop:build
```

Electron نسخه installer و portable `.exe` می‌سازد.

---

## 💻 CLI

```bash
node cli/encryption-center.mjs help
node cli/encryption-center.mjs encrypt secret.pdf secret.pdf.enc
node cli/encryption-center.mjs decrypt secret.pdf.enc secret.pdf
node cli/encryption-center.mjs hash secret.pdf sha256
node cli/encryption-center.mjs inspect secret.pdf.enc
```

---

## 🧪 بررسی قبل از انتشار

- رمزنگاری و رمزگشایی متن Unicode
- فایل خالی و فایل بزرگ
- چند فایل همزمان
- پوشه تو در تو و نام فایل فارسی
- رمز اشتباه
- فایل ECV2 خراب یا ناقص
- تغییر یک byte در ciphertext و بررسی شکست احراز اصالت
- امضای Ed25519 و Verify
- مقایسه hash با ابزار مستقل
- GitHub Pages در مسیر repository
- Cloudflare
- نسخه Electron/EXE
- حالت فارسی و RTL
- موبایل و keyboard navigation

---

## 📜 مجوز

این پروژه تحت [MIT License](LICENSE) منتشر شده است.

Copyright © 2026 shayradghoraishi.

برای گزارش مشکلات امنیتی، ابتدا [SECURITY.md](SECURITY.md) را بخوانید.
