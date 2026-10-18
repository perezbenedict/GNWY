import type { Answers, FeedbackPayload } from '../types';

export const FEEDBACK_API = 'https://gnwy-feedback.perezbenedict007.workers.dev';

// Map each new screen-2 label to the canonical category the Response Vault counts.
const CATEGORY_BY_LABEL: Record<string, string> = {
  'The worship was something else 🎶': 'Worship',
  'The Word spoke to me 📖': 'The Word',
  'Prayer hit home 🙏': 'Other',
  'The whole atmosphere ✨': 'Other',
  'The people and connection 🫂': 'Welcome & Hospitality',
  'Something else entirely 💭': 'Other',
};

function joinLabelsAndText(labels: string[], text: string): string {
  const trimmed = text.trim();
  const joined = labels.join(', ');
  if (trimmed) return joined ? `${joined} - ${trimmed}` : trimmed;
  return joined;
}

export function buildPayload(answers: Answers): FeedbackPayload {
  const categories: string[] = [];
  for (const label of answers.stoodOut) {
    const category = CATEGORY_BY_LABEL[label];
    if (category) categories.push(category);
  }

  const suggestionParts = [...answers.next];
  if (answers.ideaCustom.trim()) suggestionParts.push(answers.ideaCustom.trim());
  if (answers.nextText.trim()) suggestionParts.push(answers.nextText.trim());

  const payload: FeedbackPayload = {
    rating: answers.rating,
    categories,
    liked: joinLabelsAndText(answers.stoodOut, answers.stoodOutText),
    disliked: joinLabelsAndText(answers.improve, answers.improveText),
    suggestions: suggestionParts.join(', '),
    expectations: '',
    name: answers.name.trim(),
    contact: answers.contact.trim(),
  };
  // Existing tests assert the exact payload shape, so only add the key when true.
  if (answers.nameIsGenerated) payload.nameIsGenerated = true;
  return payload;
}

export function payloadHasContent(payload: FeedbackPayload): boolean {
  return (
    payload.rating !== null ||
    [payload.liked, payload.disliked, payload.suggestions].some((s) => s.trim().length > 0)
  );
}

export class NicknameTakenError extends Error {
  status = 409;
  constructor() {
    super('Request failed: 409');
  }
}

export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  const res = await fetch(FEEDBACK_API + '/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    if (res.status === 409) throw new NicknameTakenError();
    throw new Error('Request failed: ' + res.status);
  }
}
