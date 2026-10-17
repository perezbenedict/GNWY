"use strict";

const FEEDBACK_API = 'https://gnwy-feedback.perezbenedict007.workers.dev'; // deployed Worker API
const DRAFT_KEY = 'gnwy-feedback-draft';

const form = document.getElementById('feedback-form');
const success = document.getElementById('success');
const errorBox = document.getElementById('form-error');
const submitBtn = document.getElementById('submit-btn');
const submitText = submitBtn.querySelector('.submit-text');
const resetBtn = document.getElementById('reset-btn');
const stars = Array.from(document.querySelectorAll('.star'));
const chips = Array.from(document.querySelectorAll('.chip'));
const fields = ['liked', 'disliked', 'suggestions', 'expectations', 'name', 'contact']
  .map((id) => document.getElementById(id));

let rating = 0;

/* ---------- rating stars ---------- */

function paintStars() {
  stars.forEach((star) => {
    const active = Number(star.dataset.value) <= rating;
    star.classList.toggle('is-active', active);
    star.setAttribute('aria-pressed', String(Number(star.dataset.value) === rating));
  });
}

stars.forEach((star) => {
  star.addEventListener('click', () => {
    const value = Number(star.dataset.value);
    rating = value === rating ? 0 : value; // click the same star again to clear
    paintStars();
    saveDraft();
  });
});

/* ---------- category chips ---------- */

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    saveDraft();
  });
});

/* ---------- draft persistence ---------- */

function collect() {
  return {
    rating,
    chips: chips
      .filter((c) => c.getAttribute('aria-pressed') === 'true')
      .map((c) => c.dataset.value),
    values: Object.fromEntries(fields.map((f) => [f.id, f.value])),
  };
}

function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(collect()));
  } catch (_) { /* storage unavailable (private mode etc.) — draft saving is best-effort */ }
}

function restoreDraft() {
  let draft = null;
  try {
    draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
  } catch (_) { /* corrupted draft — ignore */ }
  if (!draft) return;

  rating = Math.min(5, Math.max(0, Number(draft.rating) || 0));
  paintStars();

  const selected = Array.isArray(draft.chips) ? draft.chips : [];
  chips.forEach((c) => c.setAttribute('aria-pressed', String(selected.includes(c.dataset.value))));

  fields.forEach((f) => {
    if (draft.values && typeof draft.values[f.id] === 'string') f.value = draft.values[f.id];
  });
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (_) { /* ignore */ }
}

form.addEventListener('input', saveDraft);

/* ---------- error alert ---------- */

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function hideError() {
  errorBox.hidden = true;
  errorBox.textContent = '';
}

/* ---------- submit ---------- */

function hasContent() {
  return rating > 0 || fields.slice(0, 4).some((f) => f.value.trim().length > 0);
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitBtn.classList.toggle('is-loading', loading);
  submitText.textContent = loading ? 'Sending…' : 'Send Feedback';
}

function showSuccess() {
  form.hidden = true;
  success.hidden = false;
  clearDraft();
  success.querySelector('.success-title').setAttribute('tabindex', '-1');
  success.querySelector('.success-title').focus();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!hasContent()) {
    showError('Please share at least one thought before submitting.');
    return;
  }
  hideError();
  setLoading(true);

  const draft = collect();
  const payload = {
    rating: draft.rating || null,
    categories: draft.chips,
    liked: draft.values.liked,
    disliked: draft.values.disliked,
    suggestions: draft.values.suggestions,
    expectations: draft.values.expectations,
    name: draft.values.name,
    contact: draft.values.contact,
  };

  if (!FEEDBACK_API) {
    // No endpoint configured yet — succeed after a short simulated delay so the page works out of the box.
    setTimeout(showSuccess, 900);
    return;
  }

  fetch(FEEDBACK_API + '/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
    .then((res) => {
      if (!res.ok) throw new Error('Request failed: ' + res.status);
      showSuccess();
    })
    .catch(() => {
      showError('Something went wrong - please try again.');
      setLoading(false);
    });
});

/* ---------- reset ---------- */

resetBtn.addEventListener('click', () => {
  form.reset();
  rating = 0;
  paintStars();
  chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
  hideError();
  setLoading(false);
  clearDraft();
  success.hidden = true;
  form.hidden = false;
  stars[0].focus();
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/* ---------- entrance animations ---------- */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealables = document.querySelectorAll('.reveal');

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealables.forEach((el) => el.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealables.forEach((el) => observer.observe(el));
}

restoreDraft();
