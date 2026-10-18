/* GNWY feedback API — single-file Cloudflare Worker, no dependencies, no build step.
   Binds a D1 database as env.DB (see wrangler.toml) and reads env.ADMIN_TOKEN for admin routes. */

const KNOWN_CATEGORIES = [
  'Worship',
  'The Word',
  'Production & Sound',
  'Welcome & Hospitality',
  'Youth Activities',
  'Logistics & Venue',
  'Other',
];

const MAX_TEXT = 5000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function isAuthorized(request, env) {
  if (!env.ADMIN_TOKEN) return false; // refuse everything if the token is unset
  return request.headers.get('Authorization') === 'Bearer ' + env.ADMIN_TOKEN;
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim().slice(0, MAX_TEXT) : '';
}

/* ---------- public: used nicknames ---------- */

async function handleUsedNicknames(request, env) {
  try {
    const rows = await env.DB.prepare('SELECT nickname FROM used_nicknames ORDER BY created_at ASC').all();
    return json({ used: rows.results.map((r) => r.nickname) });
  } catch (_) {
    return json({ used: [] });
  }
}

/* ---------- public: create ---------- */

async function handleCreate(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ error: 'invalid JSON body' }, 400);
  }
  body = body || {};

  const rawRating = body.rating;
  const rating = rawRating === undefined || rawRating === null || rawRating === '' ? null : rawRating;
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return json({ error: 'rating must be an integer between 1 and 5' }, 400);
  }

  const categories = Array.isArray(body.categories)
    ? body.categories.filter((c) => typeof c === 'string' && c.trim()).join(',')
    : '';

  const liked = cleanText(body.liked);
  const disliked = cleanText(body.disliked);
  const suggestions = cleanText(body.suggestions);
  const expectations = cleanText(body.expectations);
  const name = cleanText(body.name);
  const contact = cleanText(body.contact);

  if (rating === null && !liked && !disliked && !suggestions && !expectations) {
    return json({ error: 'provide a rating or at least one written response' }, 400);
  }

  const id = crypto.randomUUID();
  const nameIsGenerated = body.nameIsGenerated === true;
  if (nameIsGenerated && name) {
    // Atomic: claim the nickname and insert the feedback in one batch so a
    // duplicate nickname (UNIQUE constraint) fails before writing either row.
    try {
      await env.DB.batch([
        env.DB.prepare('INSERT INTO used_nicknames (nickname) VALUES (?)').bind(name),
        env.DB.prepare(
          "INSERT INTO feedback (id, created_at, rating, categories, liked, disliked, suggestions, expectations, name, contact) " +
            "VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(id, rating, categories, liked, disliked, suggestions, expectations, name, contact),
      ]);
    } catch (err) {
      const message = String((err && err.message) || err);
      if (message.includes('UNIQUE constraint failed') || /unique constraint/i.test(message)) {
        return json({ error: 'nickname_taken' }, 409);
      }
      throw err;
    }
  } else {
    await env.DB.prepare(
      "INSERT INTO feedback (id, created_at, rating, categories, liked, disliked, suggestions, expectations, name, contact) " +
        "VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?)"
    )
      .bind(id, rating, categories, liked, disliked, suggestions, expectations, name, contact)
      .run();
  }

  return json({ ok: true, id }, 201);
}

/* ---------- admin: list + summary ---------- */

function listWhere(url) {
  const where = [];
  const params = [];

  const minRating = url.searchParams.get('minRating');
  if (minRating !== null && minRating !== '') {
    const n = Number(minRating);
    if (!Number.isInteger(n)) return { error: 'minRating must be an integer' };
    where.push('rating >= ?');
    params.push(n);
  }

  const category = url.searchParams.get('category');
  if (category) {
    // comma-boundary match so "Other" does not match "Other Stuff"
    where.push('(categories = ? OR categories LIKE ? OR categories LIKE ? OR categories LIKE ?)');
    params.push(category, category + ',%', '%,' + category, '%,' + category + ',%');
  }

  const q = url.searchParams.get('q');
  if (q) {
    const like = '%' + q + '%';
    where.push(
      '(liked LIKE ? OR disliked LIKE ? OR suggestions LIKE ? OR expectations LIKE ? OR name LIKE ? OR contact LIKE ?)'
    );
    params.push(like, like, like, like, like, like);
  }

  const since = url.searchParams.get('since');
  if (since) {
    where.push('created_at >= ?');
    params.push(since);
  }

  return { sql: where.length ? ' WHERE ' + where.join(' AND ') : '', params };
}

async function handleList(request, env) {
  if (!isAuthorized(request, env)) return json({ error: 'unauthorized' }, 401);

  const url = new URL(request.url);
  const filter = listWhere(url);
  if (filter.error) return json({ error: filter.error }, 400);

  const itemsResult = await env.DB.prepare(
    'SELECT id, created_at, rating, categories, liked, disliked, suggestions, expectations, name, contact ' +
      'FROM feedback' +
      filter.sql +
      ' ORDER BY created_at DESC'
  )
    .bind(...filter.params)
    .all();

  // Summary uses the same filters so items and summary always agree.
  const categoryCounts = {};
  const categorySelect = KNOWN_CATEGORIES.map(
    (c, i) => `SUM(CASE WHEN categories LIKE '%' || ? || '%' THEN 1 ELSE 0 END) AS cat${i}`
  ).join(', ');
  const summaryRow = await env.DB.prepare(
    'SELECT COUNT(*) AS total, AVG(rating) AS averageRating, ' +
      "SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END) AS todayCount, " +
      categorySelect +
      ' FROM feedback' +
      filter.sql
  )
    .bind(...KNOWN_CATEGORIES, ...filter.params)
    .first();

  KNOWN_CATEGORIES.forEach((c, i) => {
    categoryCounts[c] = summaryRow['cat' + i] || 0;
  });

  return json({
    items: itemsResult.results,
    summary: {
      total: summaryRow.total || 0,
      averageRating: summaryRow.averageRating === null ? null : summaryRow.averageRating,
      todayCount: summaryRow.todayCount || 0,
      categoryCounts,
    },
  });
}

/* ---------- admin: CSV export ---------- */

function csvField(value) {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

async function handleExport(request, env) {
  if (!isAuthorized(request, env)) return json({ error: 'unauthorized' }, 401);

  const rows = await env.DB.prepare(
    'SELECT id, created_at, rating, categories, liked, disliked, suggestions, expectations, name, contact ' +
      'FROM feedback ORDER BY created_at DESC'
  ).all();

  const header = 'id,created_at,rating,categories,liked,disliked,suggestions,expectations,name,contact';
  const lines = rows.results.map((r) =>
    [r.id, r.created_at, r.rating, r.categories, r.liked, r.disliked, r.suggestions, r.expectations, r.name, r.contact]
      .map(csvField)
      .join(',')
  );
  const csv = [header, ...lines].join('\n') + '\n';

  return new Response(csv, {
    headers: { ...CORS_HEADERS, 'Content-Type': 'text/csv; charset=utf-8' },
  });
}

/* ---------- admin: delete ---------- */

async function handleDelete(request, env, id) {
  if (!isAuthorized(request, env)) return json({ error: 'unauthorized' }, 401);

  const result = await env.DB.prepare('DELETE FROM feedback WHERE id = ?').bind(id).run();
  if (!result.meta.changes) return json({ error: 'not found' }, 404);
  return json({ ok: true });
}

/* ---------- router ---------- */

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const method = request.method;

    try {
      if (path === '/api/health' && method === 'GET') return json({ ok: true });

      if (path === '/api/nicknames/used' && method === 'GET') return await handleUsedNicknames(request, env);

      if (path === '/api/feedback') {
        if (method === 'POST') return await handleCreate(request, env);
        if (method === 'GET') return await handleList(request, env);
      }

      if (path === '/api/feedback/export.csv' && method === 'GET') {
        return await handleExport(request, env);
      }

      const deleteMatch = path.match(/^\/api\/feedback\/([^/]+)$/);
      if (deleteMatch && method === 'DELETE') {
        return await handleDelete(request, env, decodeURIComponent(deleteMatch[1]));
      }
    } catch (_) {
      return json({ error: 'internal error' }, 500);
    }

    return json({ error: 'not found' }, 404);
  },
};
