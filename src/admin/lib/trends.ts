import type { FeedbackItem } from '../types';

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

function parseTimestamp(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function dailySeries(
  items: FeedbackItem[],
  days = 14
): Array<{ key: string; date: Date; count: number; avgRating: number | null }> {
  const byKey = new Map<string, { count: number; sum: number; rated: number }>();

  for (const item of items) {
    const date = parseTimestamp(item.created_at);
    if (!date) continue;
    const key = localKey(date);
    const entry = byKey.get(key) ?? { count: 0, sum: 0, rated: 0 };
    entry.count += 1;
    if (item.rating !== null) {
      entry.sum += item.rating;
      entry.rated += 1;
    }
    byKey.set(key, entry);
  }

  const today = startOfLocalDay(new Date());
  const series: Array<{ key: string; date: Date; count: number; avgRating: number | null }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const entry = byKey.get(localKey(date));
    series.push({
      key: localKey(date),
      date,
      count: entry?.count ?? 0,
      // null when the day has no items or all of its ratings are null
      avgRating: entry && entry.rated > 0 ? Math.round((entry.sum / entry.rated) * 10) / 10 : null,
    });
  }
  return series;
}

export function timeOfDay(items: FeedbackItem[]): {
  morning: number;
  afternoon: number;
  evening: number;
} {
  const buckets = { morning: 0, afternoon: 0, evening: 0 };
  for (const item of items) {
    const date = parseTimestamp(item.created_at);
    if (!date) continue;
    const hour = date.getHours();
    if (hour < 12) buckets.morning += 1;
    else if (hour < 17) buckets.afternoon += 1;
    else buckets.evening += 1;
  }
  return buckets;
}

export function contactRate(items: FeedbackItem[]): {
  withContact: number;
  total: number;
  pct: number;
} {
  const withContact = items.filter((item) => item.contact.trim().length > 0).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((withContact / total) * 100) : 0;
  return { withContact, total, pct };
}

export function momentum(items: FeedbackItem[]): {
  current7: number;
  previous7: number;
  deltaPct: number | null;
} {
  const today = startOfLocalDay(new Date());
  const currentStart = new Date(today);
  currentStart.setDate(currentStart.getDate() - 6);
  const previousStart = new Date(today);
  previousStart.setDate(previousStart.getDate() - 13);

  let current7 = 0;
  let previous7 = 0;
  for (const item of items) {
    const date = parseTimestamp(item.created_at);
    if (!date) continue;
    const day = startOfLocalDay(date);
    if (day >= currentStart && day <= today) current7 += 1;
    else if (day >= previousStart && day < currentStart) previous7 += 1;
  }

  const deltaPct =
    previous7 === 0
      ? current7 > 0
        ? null
        : 0
      : Math.round(((current7 - previous7) / previous7) * 100);
  return { current7, previous7, deltaPct };
}
