# GNWY — Service Feedback

Post-service feedback system for Grace Nation Wealthy Youths.

## Pages

- `index.html` → `src/` — public React feedback form (rating, liked/disliked, suggestions, expectations). Scanned via the QR poster.
- `admin.html` → `src/admin/` — "Response Vault" React dashboard for leadership: animated stats, filters, CSV export, discard.
- `public/poster.html` — printable A4 standee with QR code linking to the form. Print to PDF (Cmd+P).

## Backend

`api/worker.js` is a dependency-free Cloudflare Worker backed by a D1 database (submit, list, CSV export, delete). See `DEPLOY.md` for setup.

## Configuration

The deployed Worker URL lives in:

- `src/api/submit.ts` — `export const FEEDBACK_API = '...'` (public form)
- `src/admin/api.ts` — `const FEEDBACK_API = '...'` (Response Vault)
- `public/poster.html` — `const SITE_URL = '...'` (the public form URL)

Drop the ministry logo at `assets/logo.png` to replace the built-in SVG emblem.
