# GNWY — Service Feedback

Post-service feedback system for Grace Nation Wealthy Youths.

## Pages

- `index.html` — public feedback form (rating, liked/disliked, suggestions, expectations). Scanned via the QR poster.
- `poster.html` — printable A4 standee with QR code linking to the form. Print to PDF (Cmd+P).
- `admin.html` — "Response Vault" for leadership: stats, filters, CSV export, discard.

## Backend

`api/worker.js` is a dependency-free Cloudflare Worker backed by a D1 database (submit, list, CSV export, delete). See `DEPLOY.md` for setup.

## Configuration

Paste your deployed Worker URL into:

- `app.js` — `const FEEDBACK_API = ''`
- `admin.js` — `const FEEDBACK_API = ''`
- `poster.html` — `const SITE_URL = ''` (the public form URL)

Drop the ministry logo at `assets/logo.png` to replace the built-in SVG emblem.
