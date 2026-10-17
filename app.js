"use strict";

const FEEDBACK_API = 'https://gnwy-feedback.perezbenedict007.workers.dev'; // deployed Worker API
const DRAFT_KEY = 'gnwy-feedback-draft';

const form = document.getElementById('feedback-form');
const success = document.getElementById('success');
const errorBox = document.getElementById('form-error');
const submitBtn = document.getElementById('submit-btn');
const submitText = submitBtn.querySelector('.submit-text');
const resetBtn = document.getElementById('reset-btn');

const steps = Array.from(document.querySelectorAll('.step'));
const stepNav = document.getElementById('step-nav');
const backBtn = document.getElementById('back-btn');
const nextBtn = document.getElementById('next-btn');
const skipBtn = document.getElementById('skip-btn');
const skipRow = document.getElementById('skip-row');
const progressFill = document.getElementById('progress-fill');
const review = document.getElementById('review');
const reviewList = document.getElementById('review-list');
const reviewHint = document.getElementById('review-hint');
const ratingInputs = Array.from(document.querySelectorAll('input[name="rating"]'));
const allChips = Array.from(document.querySelectorAll('.chip'));
const fields = ['liked', 'disliked', 'suggestions', 'expectations', 'name', 'contact', 'idea-custom']
  .map((id) => document.getElementById(id));

const LAST_STEP = steps.length - 1;
const RATING_WORDS = ['drained', 'not for me', 'it was okay', 'really good', 'incredible'];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let rating = 0;
let currentStep = 0;
let submitting = false;

/* ---------- rating (native radios: mutually exclusive + keyboard arrows) ---------- */

function paintRating() {
  ratingInputs.forEach((input) => {
    input.checked = Number(input.value) === rating;
  });
}

ratingInputs.forEach((input) => {
  input.addEventListener('change', () => {
    rating = Number(input.value);
    saveDraft();
  });
});

/* ---------- chips ---------- */

function chipLabels(groupId) {
  return Array.from(document.querySelectorAll('#' + groupId + ' .chip'))
    .filter((c) => c.getAttribute('aria-pressed') === 'true')
    .map((c) => c.dataset.value);
}

function setPressed(groupId, values) {
  document.querySelectorAll('#' + groupId + ' .chip').forEach((c) => {
    c.setAttribute('aria-pressed', String(values.indexOf(c.dataset.value) !== -1));
  });
}

allChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const group = chip.closest('.chips');
    const on = chip.getAttribute('aria-pressed') === 'true';
    if (group && group.dataset.exclusive === 'true') {
      // 'Nothing to improve' cannot coexist with any other improvement chip
      Array.from(group.querySelectorAll('.chip')).forEach((c) => {
        c.setAttribute('aria-pressed', String(c === chip ? !on : false));
      });
    } else {
      chip.setAttribute('aria-pressed', String(!on));
    }
    saveDraft();
  });
});

function enforceExclusive() {
  const group = document.getElementById('chips-improve');
  if (!group) return;
  const items = Array.from(group.querySelectorAll('.chip'));
  const none = items.filter((c) => c.dataset.none === 'true')[0];
  if (none && none.getAttribute('aria-pressed') === 'true') {
    items.forEach((c) => {
      if (c !== none) c.setAttribute('aria-pressed', 'false');
    });
  }
}

/* ---------- payload serialization ---------- */

function fieldValue(id) {
  const el = document.getElementById(id);
  return el ? String(el.value || '') : '';
}

function buildDisliked() {
  const labels = chipLabels('chips-improve');
  const comment = fieldValue('disliked').trim();
  if (labels.length && comment) return labels.join(', ') + ' - ' + comment;
  return labels.length ? labels.join(', ') : comment;
}

function buildSuggestions() {
  const parts = chipLabels('chips-ideas').slice();
  const custom = fieldValue('idea-custom').trim();
  const comment = fieldValue('suggestions').trim();
  if (custom) parts.push(custom);
  if (comment) parts.push(comment);
  return parts.join(', ');
}

function buildPayload() {
  return {
    rating: rating || null,
    categories: chipLabels('chips-standout'),
    liked: fieldValue('liked'),
    disliked: buildDisliked(),
    suggestions: buildSuggestions(),
    expectations: fieldValue('expectations'),
    name: fieldValue('name'),
    contact: fieldValue('contact'),
  };
}

function payloadHasContent(payload) {
  return payload.rating !== null ||
    ['liked', 'disliked', 'suggestions', 'expectations']
      .some((key) => payload[key].trim().length > 0);
}

/* ---------- draft persistence (answers + current step) ---------- */

function collect() {
  return {
    rating,
    chips: chipLabels('chips-standout'),
    improve: chipLabels('chips-improve'),
    ideas: chipLabels('chips-ideas'),
    values: Object.fromEntries(fields.map((f) => [f.id, String(f.value || '')])),
    step: currentStep,
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
  if (!draft || typeof draft !== 'object') return;

  rating = Math.min(5, Math.max(0, Number(draft.rating) || 0));
  paintRating();

  setPressed('chips-standout', Array.isArray(draft.chips) ? draft.chips : []);
  setPressed('chips-improve', Array.isArray(draft.improve) ? draft.improve : []);
  setPressed('chips-ideas', Array.isArray(draft.ideas) ? draft.ideas : []);
  enforceExclusive();

  fields.forEach((f) => {
    if (draft.values && typeof draft.values[f.id] === 'string') f.value = draft.values[f.id];
  });

  goToStep(Number(draft.step) || 0, false);
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

/* ---------- step navigation ---------- */

function renderReview() {
  const p = buildPayload();
  const rows = [];
  if (p.rating !== null) rows.push(['Rating', p.rating + ' of 5 · ' + RATING_WORDS[p.rating - 1]]);
  if (p.categories.length) rows.push(['What stood out', p.categories.join(', ')]);
  if (p.liked.trim()) rows.push(['What moved you', p.liked.trim()]);
  if (p.disliked.trim()) rows.push(['Could be better', p.disliked.trim()]);
  if (p.suggestions.trim()) rows.push(['Ideas for next', p.suggestions.trim()]);
  if (p.expectations.trim()) rows.push(['Expectations', p.expectations.trim()]);
  if (p.name.trim()) rows.push(['Name', p.name.trim()]);
  if (p.contact.trim()) rows.push(['Contact', p.contact.trim()]);

  const clip = (s) => (s.length > 160 ? s.slice(0, 157) + '…' : s);

  reviewList.textContent = '';
  if (!rows.length) {
    const li = document.createElement('li');
    li.className = 'review-empty';
    li.textContent = 'Nothing yet — go back and share at least one thought.';
    reviewList.appendChild(li);
    reviewHint.hidden = true;
  } else {
    rows.forEach((row) => {
      const li = document.createElement('li');
      const key = document.createElement('span');
      key.className = 'review-key';
      key.textContent = row[0];
      const val = document.createElement('span');
      val.className = 'review-val';
      val.textContent = clip(row[1]);
      li.appendChild(key);
      li.appendChild(val);
      reviewList.appendChild(li);
    });
    reviewHint.hidden = false;
  }
  review.hidden = false;
}

function goToStep(index, moveFocus) {
  currentStep = Math.max(0, Math.min(LAST_STEP, index));
  const onLastStep = currentStep === LAST_STEP;
  steps.forEach((step, i) => {
    step.hidden = i !== currentStep;
  });
  backBtn.hidden = currentStep === 0;
  nextBtn.hidden = onLastStep;
  skipRow.hidden = onLastStep;
  progressFill.style.width = ((currentStep + 1) / steps.length) * 100 + '%';
  if (onLastStep) renderReview();
  hideError();

  // Keep Back/Skip under the current step, and Back above the final Send button
  const activeStep = steps[currentStep];
  if (onLastStep) {
    if (submitBtn.parentNode) submitBtn.parentNode.insertBefore(stepNav, submitBtn);
  } else {
    activeStep.appendChild(stepNav);
    if (!skipRow.hidden) activeStep.appendChild(skipRow);
  }

  saveDraft();
  if (moveFocus) {
    const title = activeStep.querySelector('.step-title');
    if (title) title.focus();
  }
}

backBtn.addEventListener('click', () => goToStep(currentStep - 1, true));
nextBtn.addEventListener('click', () => goToStep(currentStep + 1, true));
skipBtn.addEventListener('click', () => goToStep(currentStep + 1, true));

// Enter advances between steps; only the last step allows implicit form submission
form.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || !e.target) return;
  if (e.target.tagName === 'TEXTAREA') return;
  if (e.target.tagName === 'INPUT' && currentStep < LAST_STEP) {
    e.preventDefault();
    goToStep(currentStep + 1, true);
  }
});

// Keep focused inputs clear of the on-screen keyboard / step edges
form.addEventListener('focusin', (e) => {
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) {
    t.scrollIntoView({ block: 'nearest' });
  }
});

/* ---------- submit ---------- */

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitBtn.classList.toggle('is-loading', loading);
  submitText.textContent = loading ? 'Sending…' : 'Send Feedback';
}

function showSuccess() {
  form.hidden = true;
  success.hidden = false;
  clearDraft();
  success.querySelector('.success-title').focus();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  if (submitting) return;

  const payload = buildPayload();
  if (!payloadHasContent(payload)) {
    showError('Please share at least one thought before submitting.');
    return;
  }
  hideError();
  submitting = true;
  setLoading(true);

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
      submitting = false;
      setLoading(false);
    });
});

/* ---------- reset ---------- */

resetBtn.addEventListener('click', () => {
  form.reset();
  rating = 0;
  paintRating();
  allChips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
  hideError();
  submitting = false;
  setLoading(false);
  success.hidden = true;
  form.hidden = false;
  goToStep(0, false);
  clearDraft();
  const title = steps[0].querySelector('.step-title');
  if (title) title.focus();
  form.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
});

/* ---------- entrance animations ---------- */

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
