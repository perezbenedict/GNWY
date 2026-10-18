// Pure helpers backing the service-day comparison panel.
import { NEXT_OPTIONS } from '../../screens/NextScreen';
import { countKnownLabels } from './insights';
import { dailySeries } from './trends';
import type { FeedbackItem } from '../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseTimestamp(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfLocalDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function localKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// dailySeries only emits the N local days ending today, so size its window to
// reach back to the earliest response.
function spanToToday(items: FeedbackItem[]): number | null {
  let earliest: Date | null = null;
  for (const item of items) {
    const date = parseTimestamp(item.created_at);
    if (date && (!earliest || date < earliest)) earliest = date;
  }
  if (!earliest) return null;
  const daysBack = Math.round(
    (startOfLocalDay(new Date()).getTime() - startOfLocalDay(earliest).getTime()) / MS_PER_DAY
  );
  return Math.max(1, daysBack + 1);
}

export function serviceDayKeys(items: FeedbackItem[]): string[] {
  if (items.length === 0) return [];
  const span = spanToToday(items);
  if (span === null) return [];
  // Reuses trends' local-day bucketing: ascending, deduped, zero-count days dropped.
  return dailySeries(items, span)
    .filter((point) => point.count > 0)
    .map((point) => point.key);
}

export interface DayComparison {
  a: string;
  b: string;
  countA: number;
  countB: number;
  avgA: number | null;
  avgB: number | null;
  positiveA: number;
  positiveB: number;
  topCategoryA: string | null;
  topCategoryB: string | null;
  topActivityA: string | null;
  topActivityB: string | null;
}

// Sentiment derived-from rating, never from free text: 4-5 positive,
// 3 neutral, 1-2 negative. Null ratings are excluded from every denominator,
// so positiveA/positiveB are the percent of rated responses that are positive.
interface DayBucket {
  count: number;
  ratingSum: number;
  rated: number;
  positive: number;
  categories: Map<string, number>;
  activities: Map<string, number>;
}

function bump(counts: Map<string, number>, label: string): void {
  counts.set(label, (counts.get(label) ?? 0) + 1);
}

function bucketByDay(items: FeedbackItem[]): Map<string, DayBucket> {
  const byDay = new Map<string, DayBucket>();
  for (const item of items) {
    const date = parseTimestamp(item.created_at);
    if (!date) continue;
    const bucket = byDay.get(localKey(date)) ?? {
      count: 0,
      ratingSum: 0,
      rated: 0,
      positive: 0,
      categories: new Map<string, number>(),
      activities: new Map<string, number>(),
    };
    bucket.count += 1;
    if (item.rating !== null) {
      bucket.ratingSum += item.rating;
      bucket.rated += 1;
      if (item.rating >= 4) bucket.positive += 1;
    }
    for (const raw of item.categories.split(', ')) {
      const label = raw.trim();
      if (label) bump(bucket.categories, label);
    }
    // Chips only, against the canonical list; 'label - note' tails are stripped
    // by countKnownLabels, same parsing the polls use.
    for (const { label } of countKnownLabels(item.suggestions, NEXT_OPTIONS).counts) {
      bump(bucket.activities, label);
    }
    byDay.set(localKey(date), bucket);
  }
  return byDay;
}

function topLabel(counts: Map<string, number> | undefined): string | null {
  if (!counts || counts.size === 0) return null;
  let bestLabel: string | null = null;
  let bestCount = -1;
  for (const [label, count] of counts) {
    if (count > bestCount || (count === bestCount && bestLabel !== null && label.localeCompare(bestLabel) < 0)) {
      bestLabel = label;
      bestCount = count;
    }
  }
  return bestLabel;
}

export function compareDays(items: FeedbackItem[], a: string, b: string): DayComparison {
  const byDay = bucketByDay(items);
  const side = (bucket: DayBucket | undefined) => ({
    count: bucket?.count ?? 0,
    avg:
      bucket && bucket.rated > 0 ? Math.round((bucket.ratingSum / bucket.rated) * 10) / 10 : null,
    positivePct:
      bucket && bucket.rated > 0 ? Math.round((bucket.positive / bucket.rated) * 100) : 0,
    topCategory: topLabel(bucket?.categories),
    topActivity: topLabel(bucket?.activities),
  });
  const left = side(byDay.get(a));
  const right = side(byDay.get(b));
  return {
    a,
    b,
    countA: left.count,
    countB: right.count,
    avgA: left.avg,
    avgB: right.avg,
    positiveA: left.positivePct,
    positiveB: right.positivePct,
    topCategoryA: left.topCategory,
    topCategoryB: right.topCategory,
    topActivityA: left.topActivity,
    topActivityB: right.topActivity,
  };
}
