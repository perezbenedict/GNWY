import { useCallback, useEffect, useRef, useState } from 'react';
import { EMPTY_ANSWERS, type Answers } from '../types';

export const DRAFT_KEY = 'gnwy-feedback-draft';

// 0 = Intro, 1-5 = question screens, 6 = Review
export const MAX_STEP = 6;

interface Draft {
  answers: Answers;
  step: number;
}

function sanitizeAnswers(raw: unknown): Answers {
  const a = (raw && typeof raw === 'object' ? raw : {}) as Partial<Answers>;
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const rating =
    a.rating === 1 || a.rating === 2 || a.rating === 3 || a.rating === 4 || a.rating === 5 ? a.rating : null;
  return {
    rating,
    stoodOut: arr(a.stoodOut),
    stoodOutText: str(a.stoodOutText),
    improve: arr(a.improve),
    improveText: str(a.improveText),
    next: arr(a.next),
    nextText: str(a.nextText),
    ideaCustom: str(a.ideaCustom),
    name: str(a.name),
    contact: str(a.contact),
  };
}

function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return { answers: EMPTY_ANSWERS, step: 0 };
    const draft = JSON.parse(raw);
    if (!draft || typeof draft !== 'object') return { answers: EMPTY_ANSWERS, step: 0 };
    const step = Number(draft.step);
    return {
      answers: sanitizeAnswers((draft as Draft).answers),
      step: Number.isFinite(step) ? Math.min(Math.max(Math.trunc(step), 0), MAX_STEP) : 0,
    };
  } catch {
    return { answers: EMPTY_ANSWERS, step: 0 };
  }
}

export function useAnswers() {
  const [draft, setDraft] = useState<Draft>(loadDraft);
  const skipNextPersist = useRef(false);

  useEffect(() => {
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // storage unavailable (private mode) — draft saving is best-effort
    }
  }, [draft]);

  const setAnswer = useCallback((patch: Partial<Answers>) => {
    setDraft((d) => ({ ...d, answers: { ...d.answers, ...patch } }));
  }, []);

  const goTo = useCallback((step: number) => {
    setDraft((d) => ({ ...d, step: Math.min(Math.max(Math.trunc(step), 0), MAX_STEP) }));
  }, []);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    // don't let the next state change (e.g. returning to Intro) resurrect the draft
    skipNextPersist.current = true;
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    skipNextPersist.current = true;
    setDraft({ answers: EMPTY_ANSWERS, step: 0 });
  }, []);

  return { answers: draft.answers, step: draft.step, setAnswer, goTo, clearDraft, reset };
}
