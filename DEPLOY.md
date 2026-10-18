# Deploying the GNWY feedback API

The API is a single-file Cloudflare Worker (`api/worker.js`) backed by a D1 database. No npm dependencies, no build step.

## 1. Install and log in

```sh
npm install -g wrangler
wrangler login
```

## 2. Create the D1 database

```sh
wrangler d1 create gnwy-feedback
```

Paste the `database_id` from the output into `api/wrangler.toml` (replace `REPLACE_WITH_YOUR_DATABASE_ID`).

## 3. Create the table

Run this in the Cloudflare dashboard (Workers & Pages → your database → Query) or via the CLI:

```sql
CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  rating INTEGER,
  categories TEXT,
  liked TEXT,
  disliked TEXT,
  suggestions TEXT,
  expectations TEXT,
  name TEXT,
  contact TEXT
);
```

CLI equivalent:

```sh
wrangler d1 execute gnwy-feedback --remote --command "CREATE TABLE feedback (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, rating INTEGER, categories TEXT, liked TEXT, disliked TEXT, suggestions TEXT, expectations TEXT, name TEXT, contact TEXT);"
```

(categories are stored comma-joined in the single `categories` column; `created_at` is set by the Worker with `datetime('now')`.)

## 4. Set the admin token

Replace `REPLACE_WITH_A_LONG_RANDOM_SECRET` in `api/wrangler.toml` with a long random string, e.g.:

```sh
openssl rand -hex 32
```

This token is required as `Authorization: Bearer <token>` for the list, CSV export and delete routes.

## 5. Deploy

```sh
cd api
wrangler deploy
```

Note the deployed URL, e.g. `https://gnwy-feedback.<account>.workers.dev`.

## 6. Hook up the site

- The Worker URL is already set in `src/api/submit.ts` (`FEEDBACK_API`) and `src/admin/api.ts` (`FEEDBACK_API`).
- Paste the same URL into `public/poster.html` (`SITE_URL`).
- Open `admin.html` (built React vault) and enter the same `ADMIN_TOKEN` to view submissions.
