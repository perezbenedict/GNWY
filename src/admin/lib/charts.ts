import type { FeedbackItem } from '../types';

// Pure geometry/counting helpers for the SVG charts. No React here.

export function ratingDistribution(
  items: FeedbackItem[]
): Array<{ rating: number; count: number }> {
  const buckets = [1, 2, 3, 4, 5].map((rating) => ({ rating, count: 0 }));
  for (const item of items) {
    // find() misses on null and out-of-range ratings, so they stay excluded.
    const bucket = buckets.find((entry) => entry.rating === item.rating);
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

// Pinned sentiment rule: rating 4-5 positive, 3 neutral, 1-2 attention,
// null unrated.
export function sentimentSplit(items: FeedbackItem[]): {
  positive: number;
  neutral: number;
  attention: number;
  unrated: number;
} {
  const split = { positive: 0, neutral: 0, attention: 0, unrated: 0 };
  for (const item of items) {
    if (item.rating === null) split.unrated += 1;
    else if (item.rating >= 4) split.positive += 1;
    else if (item.rating === 3) split.neutral += 1;
    else split.attention += 1;
  }
  return split;
}

export function seriesToPath(
  points: Array<{ label: string; value: number }>,
  width: number,
  height: number,
  pad = 28
): { line: string; area: string; max: number } {
  const max = Math.max(0, ...points.map((point) => point.value));
  // Nothing drawable: no points, or every value is zero (or negative).
  if (points.length === 0 || max === 0) return { line: '', area: '', max };

  const left = pad;
  const right = width - pad;
  const bottom = height - pad;
  const innerWidth = Math.max(1, right - left);
  const innerHeight = Math.max(1, bottom - pad);
  const round = (value: number): number => Math.round(value * 100) / 100;

  // A single point draws as a flat line so it stays visible.
  const xFor = (index: number): number =>
    points.length === 1
      ? round(left + innerWidth / 2)
      : round(left + (index / (points.length - 1)) * innerWidth);
  const yFor = (value: number): number => round(bottom - (value / max) * innerHeight);

  const coords = points.map((point, index) => ({ x: xFor(index), y: yFor(point.value) }));
  const first = coords[0];
  const last = coords[coords.length - 1];
  const startX = points.length === 1 ? round(left) : first.x;
  const endX = points.length === 1 ? round(right) : last.x;

  const line =
    points.length === 1
      ? `M ${startX} ${first.y} L ${endX} ${first.y}`
      : coords.map((coord, index) => `${index === 0 ? 'M' : 'L'} ${coord.x} ${coord.y}`).join(' ');

  const baseline = round(bottom);
  const area = `${line} L ${endX} ${baseline} L ${startX} ${baseline} Z`;
  return { line, area, max };
}

// 'YYYY-MM-DD' keys parse as UTC midnight, which shifts a day in western
// timezones, so calendar-date keys are read as plain local dates.
export function formatDayLabel(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function barGeometry(
  counts: number[],
  width: number,
  height: number,
  pad = 28
): Array<{ x: number; y: number; w: number; h: number; count: number; index: number }> {
  if (counts.length === 0) return [];
  const left = pad;
  const bottom = height - pad;
  const innerWidth = Math.max(1, width - pad * 2);
  const innerHeight = Math.max(1, height - pad * 2);
  const max = Math.max(0, ...counts);
  const slot = innerWidth / counts.length;
  const round = (value: number): number => Math.round(value * 100) / 100;

  return counts.map((count, index) => {
    // A single bar fills the whole plot width; wider sets share slots with a gap.
    const w = counts.length === 1 ? innerWidth : Math.max(1, slot * 0.6);
    const x = left + (counts.length === 1 ? 0 : slot * index + (slot - w) / 2);
    const h = max > 0 ? Math.max(0, (count / max) * innerHeight) : 0;
    return { x: round(x), y: round(bottom - h), w: round(w), h: round(h), count, index };
  });
}
