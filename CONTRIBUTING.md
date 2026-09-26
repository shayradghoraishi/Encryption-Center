# Contributing to Encryption Center

Thanks for helping improve the project.

## Development

```bash
npm ci
npm run check
npm run dev
```

## Pull requests

Please keep changes focused and update documentation when behavior or file formats change.

For cryptographic changes, include:

- format/version impact;
- compatibility behavior;
- positive and negative test cases;
- independent test vectors where possible;
- threat-model/security reasoning.

Avoid introducing custom cryptographic primitives. Prefer standard, reviewed primitives and established libraries.

## UI and localization

- Keep keyboard navigation usable.
- Test narrow screens.
- Test both LTR and RTL layouts.
- Add new visible strings to the localization dictionaries.
- Do not put passwords, plaintext or private keys into analytics or logs.

## Commits

Use clear commit messages and do not commit `node_modules`, build output, private keys, passwords or test secrets.
