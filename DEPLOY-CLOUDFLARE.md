# Cloudflare Workers deployment

Encryption Center is configured to deploy as a static SPA using Cloudflare Workers Static Assets. The Worker serves the built `dist/` directory; the cryptographic operations still run in the user's browser.

## Requirements

- Node.js 22+
- A Cloudflare account
- Wrangler authentication

## Deploy

```bash
npm ci
npx wrangler login
npm run cf:preview
npm run cf:deploy
```

`npm run cf:deploy` runs `vite build` first and then deploys the resulting `dist/` directory according to `wrangler.jsonc`.

## Project name

Change the `name` field in `wrangler.jsonc` if you want a different Worker name.

## Custom domains

After deployment, add a custom domain from the Cloudflare dashboard under the Worker’s domain/route settings.

## Why HashRouter?

The app uses React Router's `HashRouter`, so routes such as `/#/files` do not require server-side rewrites. This is useful for GitHub Pages and also works normally on Cloudflare Workers.

## Service worker

`public/sw.js` is registered using Vite's runtime base URL, so the same build can run at the root domain or under a project sub-path.
