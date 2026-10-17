const FEEDBACK_API = 'https://gnwy-feedback.perezbenedict007.workers.dev'; // deployed Worker API

const TOKEN_KEY = 'gnwy_admin_token';
const CONFIG_MESSAGE =
  'Set FEEDBACK_API at the top of admin.js to your Worker URL to load responses.';

const SVG_NS = 'http://www.w3.org/2000/svg';
const STAR_PATH =
  'M12 2.6l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.52l6.58-.96z';

const filters = { q: '', minRating: '', category: '' };
let searchTimer = null;

const $ = (id) => document.getElementById(id);
const ui = {
  gate: $('gate'),
  app: $('app'),
  gateForm: $('gate-form'),
  accessKey: $('access-key'),
  gateError: $('gate-error'),
  lockBtn: $('lock-btn'),
  statTotal: $('stat-total'),
  statAverage: $('stat-average'),
  statStars: $('stat-stars'),
  statToday: $('stat-today'),
  statTop: $('stat-top'),
  statTopNote: $('stat-top-note'),
  filterQ: $('filter-q'),
  filterRating: $('filter-rating'),
  filterCategory: $('filter-category'),
  clearBtn: $('clear-btn'),
  exportBtn: $('export-btn'),
  refreshBtn: $('refresh-btn'),
  listError: $('list-error'),
  listErrorText: $('list-error-text'),
  retryBtn: $('retry-btn'),
  skeletons: $('skeletons'),
  list: $('list'),
  empty: $('empty'),
};

/* ---------- Token / screens ---------- */

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

function setToken(value) {
  localStorage.setItem(TOKEN_KEY, value);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function showGate(message) {
  ui.app.hidden = true;
  ui.gate.hidden = false;
  if (message) {
    ui.gateError.textContent = message;
    ui.gateError.hidden = false;
  } else {
    ui.gateError.hidden = true;
  }
}

function showApp() {
  ui.gate.hidden = true;
  ui.app.hidden = false;
  ui.gateError.hidden = true;
}

/* ---------- API ---------- */

class VaultError extends Error {}

function apiUrl(path) {
  return FEEDBACK_API.replace(/\/+$/, '') + path;
}

async function apiFetch(path, options = {}) {
  if (!FEEDBACK_API) throw new VaultError(CONFIG_MESSAGE);

  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set('Authorization', 'Bearer ' + token);

  let res;
  try {
    res = await fetch(apiUrl(path), Object.assign({}, options, { headers }));
  } catch (err) {
    throw new VaultError('Could not reach the server. Check your connection and try again.');
  }

  if (res.status === 401) {
    clearToken();
    showGate('Access key not recognized.');
    throw new VaultError('Access key not recognized.');
  }
  if (!res.ok) throw new VaultError('Request failed (status ' + res.status + ').');
  return res;
}

/* ---------- Rendering helpers ---------- */

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

function starIcon(filled) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'star-icon' + (filled ? ' is-on' : ''));
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', STAR_PATH);
  path.setAttribute('fill', filled ? 'url(#vault-gold)' : 'rgba(154,163,178,0.28)');
  svg.appendChild(path);
  return svg;
}

function makeStars(value, large) {
  const rounded = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  const nodes = [];
  for (let i = 1; i <= 5; i += 1) {
    const star = starIcon(i <= rounded);
    if (large) star.classList.add('star-icon--lg');
    nodes.push(star);
  }
  return nodes;
}

function ratingNode(rating) {
  const wrap = make('span', 'response-stars');
  const numeric = Number(rating);
  if (rating === null || rating === undefined || rating === '' || !Number.isFinite(numeric)) {
    wrap.classList.add('response-stars--none');
    wrap.textContent = 'No rating';
    wrap.setAttribute('aria-label', 'No rating');
    return wrap;
  }
  wrap.setAttribute('role', 'img');
  wrap.setAttribute('aria-label', 'Rated ' + Math.round(numeric) + ' out of 5');
  makeStars(numeric, false).forEach((star) => wrap.appendChild(star));
  return wrap;
}

function textBlock(label, value) {
  const block = make('div', 'block');
  block.appendChild(make('p', 'block-label', label));
  const body = make('p', 'block-value', String(value === null || value === undefined ? '' : value).trim());
  if (!body.textContent) {
    body.textContent = '-';
    body.classList.add('is-empty');
  }
  block.appendChild(body);
  return block;
}

function formatTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || '');
  return date.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCount(value) {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : '—';
}

/* ---------- Stats ---------- */

function renderStats(summary) {
  ui.statTotal.textContent = formatCount(summary.total);

  const avg = Number(summary.averageRating);
  const hasAvg =
    summary.averageRating !== null &&
    summary.averageRating !== undefined &&
    summary.averageRating !== '' &&
    Number.isFinite(avg);
  ui.statAverage.textContent = hasAvg ? avg.toFixed(1) : '—';
  ui.statStars.replaceChildren(...(hasAvg ? makeStars(avg, true) : []));

  ui.statToday.textContent = formatCount(summary.todayCount);

  const counts = summary.categoryCounts || {};
  let top = null;
  Object.keys(counts).forEach((key) => {
    const count = Number(counts[key]);
    if (!Number.isFinite(count)) return;
    if (!top || count > top.count) top = { name: key, count: count };
  });
  ui.statTop.textContent = top && top.name ? top.name : '—';
  ui.statTopNote.textContent = top && top.name ? formatCount(top.count) + ' mentions' : '';
  ui.statTopNote.hidden = !(top && top.name);
}

/* ---------- List ---------- */

function renderCard(item) {
  const card = make('article', 'response');

  const head = make('div', 'response-head');
  const meta = make('div', 'response-meta');

  const time = document.createElement('time');
  time.className = 'response-time';
  const iso = String(item.created_at || '');
  time.textContent = formatTimestamp(iso);
  if (iso) time.setAttribute('datetime', iso);
  meta.appendChild(time);
  meta.appendChild(ratingNode(item.rating));
  head.appendChild(meta);

  const discard = make('button', 'btn btn--danger btn--small', 'Discard');
  discard.type = 'button';
  discard.addEventListener('click', () => discardResponse(item.id, card, discard));
  head.appendChild(discard);
  card.appendChild(head);

  const chips = make('div', 'chips');
  String(item.categories || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((name) => chips.appendChild(make('span', 'chip', name)));
  if (chips.childElementCount) card.appendChild(chips);

  const who = [item.name, item.contact]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' · ');
  if (who) card.appendChild(make('p', 'response-who', who));

  card.appendChild(textBlock('What moved them', item.liked));
  card.appendChild(textBlock("What didn't land", item.disliked));
  card.appendChild(textBlock('Suggestions', item.suggestions));
  card.appendChild(textBlock('Expectations', item.expectations));

  return card;
}

function renderList(items) {
  const sorted = items.slice().sort((a, b) => {
    const ta = Date.parse(a && a.created_at);
    const tb = Date.parse(b && b.created_at);
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });

  // Unhide before inserting so the aria-live region announces the new cards.
  const isEmpty = !sorted.length;
  ui.list.hidden = isEmpty;
  ui.empty.hidden = !isEmpty;
  ui.list.replaceChildren(...sorted.map(renderCard));
}

/* ---------- States ---------- */

function showError(message) {
  ui.listErrorText.textContent = message;
  ui.listError.hidden = false;
  ui.skeletons.hidden = true;
}

function hideError() {
  ui.listError.hidden = true;
}

function showSkeletons() {
  hideError();
  ui.skeletons.hidden = false;
  ui.list.hidden = true;
  ui.empty.hidden = true;
  ui.list.setAttribute('aria-busy', 'true');
}

async function loadFeedback() {
  if (!FEEDBACK_API) {
    ui.skeletons.hidden = true;
    ui.list.hidden = true;
    ui.empty.hidden = true;
    showError(CONFIG_MESSAGE);
    return;
  }

  showSkeletons();
  try {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.minRating) params.set('minRating', filters.minRating);
    if (filters.category) params.set('category', filters.category);
    const query = params.toString();

    const res = await apiFetch('/api/feedback' + (query ? '?' + query : ''));
    const data = await res.json();

    renderStats(data.summary || {});
    renderList(Array.isArray(data.items) ? data.items : []);
    hideError();
  } catch (err) {
    showError(err.message || 'Could not load responses.');
  } finally {
    ui.list.setAttribute('aria-busy', 'false');
    ui.skeletons.hidden = true;
  }
}

/* ---------- Actions ---------- */

async function exportCsv() {
  ui.exportBtn.disabled = true;
  hideError();
  try {
    const res = await apiFetch('/api/feedback/export.csv');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'feedback-export.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (err) {
    showError(err.message || 'Could not export responses.');
  } finally {
    ui.exportBtn.disabled = false;
  }
}

async function discardResponse(id, card, button) {
  if (!window.confirm('Discard this response? This cannot be undone.')) return;
  button.disabled = true;
  hideError();
  try {
    await apiFetch('/api/feedback/' + encodeURIComponent(String(id)), { method: 'DELETE' });
    card.remove();
    const current = Number(ui.statTotal.textContent);
    if (Number.isFinite(current) && current > 0) ui.statTotal.textContent = String(current - 1);
    if (!ui.list.querySelector('.response')) {
      ui.list.hidden = true;
      ui.empty.hidden = false;
    }
  } catch (err) {
    button.disabled = false;
    showError(err.message || 'Could not discard this response.');
  }
}

/* ---------- Events ---------- */

ui.gateForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const key = ui.accessKey.value.trim();
  if (!key) {
    ui.gateError.textContent = 'Access key not recognized.';
    ui.gateError.hidden = false;
    return;
  }
  setToken(key);
  ui.accessKey.value = '';
  showApp();
  loadFeedback();
});

ui.lockBtn.addEventListener('click', () => {
  clearToken();
  showGate();
});

ui.filterQ.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    filters.q = ui.filterQ.value.trim();
    loadFeedback();
  }, 300);
});

ui.filterRating.addEventListener('change', () => {
  filters.minRating = ui.filterRating.value;
  loadFeedback();
});

ui.filterCategory.addEventListener('change', () => {
  filters.category = ui.filterCategory.value;
  loadFeedback();
});

ui.clearBtn.addEventListener('click', () => {
  clearTimeout(searchTimer);
  ui.filterQ.value = '';
  ui.filterRating.value = '';
  ui.filterCategory.value = '';
  filters.q = '';
  filters.minRating = '';
  filters.category = '';
  loadFeedback();
});

ui.refreshBtn.addEventListener('click', () => loadFeedback());
ui.retryBtn.addEventListener('click', () => loadFeedback());
ui.exportBtn.addEventListener('click', () => exportCsv());

/* ---------- Init ---------- */

(function init() {
  const tpl = $('emblem-tpl');
  document.querySelectorAll('[data-emblem]').forEach((slot) => {
    slot.appendChild(tpl.content.cloneNode(true));
  });

  if (getToken()) {
    showApp();
    loadFeedback();
  } else {
    showGate();
  }
})();
