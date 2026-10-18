import { IMPROVE_OPTIONS } from '../../screens/ImproveScreen';
import { NEXT_OPTIONS } from '../../screens/NextScreen';
import type { FeedbackItem } from '../types';

export interface OverviewStats {
  total: number;
  avgRating: number | null;
  rated: number;
  positive: number;
  neutral: number;
  negative: number;
  positivePct: number;
  negativePct: number;
  topCategory: { label: string; count: number } | null;
  topActivity: { label: string; count: number } | null;
  topComplaint: { label: string; count: number } | null;
  withComments: number;
  followUps: number;
  followUpPct: number;
  dayComparison: {
    currentDay: string;
    previousDay: string;
    countDelta: number;
    avgDelta: number | null;
  } | null;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

function parseTimestamp(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Local calendar day key (YYYY-MM-DD) so buckets follow the reader's timezone;
// the key also sorts chronologically as a string.
function localDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// Counts are keyed case-insensitively; `display` maps a key back to the label
// as first seen in the data. First-seen wins ties (strictly-greater replacement).
function topEntry(
  counts: Map<string, number>,
  display?: Map<string, string>,
): { label: string; count: number } | null {
  let topKey: string | null = null;
  let topCount = 0;
  for (const [key, count] of counts) {
    if (topKey === null || count > topCount) {
      topKey = key;
      topCount = count;
    }
  }
  if (topKey === null) return null;
  return { label: display?.get(topKey) ?? topKey, count: topCount };
}

function topCategoryOf(items: FeedbackItem[]): { label: string; count: number } | null {
  const counts = new Map<string, number>();
  const display = new Map<string, string>();
  for (const item of items) {
    const seenInItem = new Set<string>();
    // Stored as 'A, B'; a response votes for a category at most once.
    for (const raw of item.categories.split(',')) {
      const token = raw.trim();
      if (!token) continue;
      const key = token.toLowerCase();
      if (seenInItem.has(key)) continue;
      seenInItem.add(key);
      if (!display.has(key)) display.set(key, token);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return topEntry(counts, display);
}

// Matches field tokens exactly (case-insensitively) against the screen option
// lists. buildPayload appends free text after ' - ', so only the head of a
// token is matched; unmatched free text is ignored rather than guessed at.
function topChip(fields: string[], options: readonly string[]): { label: string; count: number } | null {
  const byLower = new Map<string, string>();
  for (const option of options) byLower.set(option.trim().toLowerCase(), option.trim());
  const counts = new Map<string, number>();
  for (const field of fields) {
    for (const raw of field.split(',')) {
      const separator = raw.indexOf(' - ');
      const head = (separator === -1 ? raw : raw.slice(0, separator)).trim().toLowerCase();
      const label = byLower.get(head);
      if (label !== undefined) counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  return topEntry(counts);
}

export function computeOverview(items: FeedbackItem[]): OverviewStats {
  const total = items.length;
  let rated = 0;
  let ratingSum = 0;
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  let withComments = 0;
  let followUps = 0;
  const dayBuckets = new Map<string, { count: number; sum: number; rated: number }>();

  for (const item of items) {
    // Sentiment derived from rating: 4-5 = positive, 3 = neutral, 1-2 = negative;
    // items with a null rating are excluded from sentiment denominators.
    if (item.rating !== null) {
      rated += 1;
      ratingSum += item.rating;
      if (item.rating >= 4) positive += 1;
      else if (item.rating === 3) neutral += 1;
      else negative += 1;
    }

    // Heuristic only: buildPayload writes the ' - ' free-text marker solely when
    // chips and text share a field, and always sets expectations to '', so
    // chip-less comments and free text inside suggestions (joined with ', ')
    // go uncounted. Non-empty expectations only occurs in data from other sources.
    if (
      item.liked.includes(' - ') ||
      item.disliked.includes(' - ') ||
      item.suggestions.includes(' - ') ||
      item.expectations.trim() !== ''
    ) {
      withComments += 1;
    }

    if (item.contact.trim() !== '') followUps += 1;

    const date = parseTimestamp(item.created_at);
    if (date) {
      const key = localDayKey(date);
      const bucket = dayBuckets.get(key) ?? { count: 0, sum: 0, rated: 0 };
      bucket.count += 1;
      if (item.rating !== null) {
        bucket.sum += item.rating;
        bucket.rated += 1;
      }
      dayBuckets.set(key, bucket);
    }
  }

  let dayComparison: OverviewStats['dayComparison'] = null;
  const days = [...dayBuckets.keys()].sort();
  if (days.length >= 2) {
    const currentKey = days[days.length - 1];
    const previousKey = days[days.length - 2];
    const current = dayBuckets.get(currentKey);
    const previous = dayBuckets.get(previousKey);
    if (current && previous) {
      dayComparison = {
        currentDay: currentKey,
        previousDay: previousKey,
        countDelta: current.count - previous.count,
        avgDelta:
          current.rated > 0 && previous.rated > 0
            ? round1(current.sum / current.rated - previous.sum / previous.rated)
            : null,
      };
    }
  }

  return {
    total,
    avgRating: rated > 0 ? round1(ratingSum / rated) : null,
    rated,
    positive,
    neutral,
    negative,
    positivePct: pct(positive, rated),
    negativePct: pct(negative, rated),
    topCategory: topCategoryOf(items),
    topActivity: topChip(
      items.map((item) => item.suggestions),
      NEXT_OPTIONS,
    ),
    topComplaint: topChip(
      items.map((item) => item.disliked),
      IMPROVE_OPTIONS,
    ),
    withComments,
    followUps,
    followUpPct: pct(followUps, total),
    dayComparison,
  };
}
