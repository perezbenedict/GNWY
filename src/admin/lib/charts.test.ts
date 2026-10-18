import { describe, expect, it } from 'vitest';
import type { FeedbackItem } from '../types';
import {
  barGeometry,
  formatDayLabel,
  ratingDistribution,
  sentimentSplit,
  seriesToPath,
} from './charts';

function makeItem(overrides: Partial<FeedbackItem>): FeedbackItem {
  return {
    id: 'item-1',
    created_at: new Date().toISOString(),
    rating: null,
    categories: '',
    liked: '',
    disliked: '',
    suggestions: '',
    expectations: '',
    name: '',
    contact: '',
    ...overrides,
  } as FeedbackItem;
}

describe('ratingDistribution', () => {
  it('counts each rating and excludes null ratings', () => {
    const buckets = ratingDistribution([
      makeItem({ rating: 5 }),
      makeItem({ rating: 5 }),
      makeItem({ rating: 4 }),
      makeItem({ rating: 1 }),
      makeItem({ rating: null }),
    ]);
    expect(buckets).toEqual([
      { rating: 1, count: 1 },
      { rating: 2, count: 0 },
      { rating: 3, count: 0 },
      { rating: 4, count: 1 },
      { rating: 5, count: 2 },
    ]);
  });

  it('always returns 5 entries, zeroed for empty input', () => {
    expect(ratingDistribution([])).toEqual([
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 0 },
      { rating: 4, count: 0 },
      { rating: 5, count: 0 },
    ]);
  });

  it('drops out-of-range ratings instead of miscounting them', () => {
    const buckets = ratingDistribution([makeItem({ rating: 0 }), makeItem({ rating: 6 })]);
    expect(buckets.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(0);
  });
});

describe('sentimentSplit', () => {
  it('applies the pinned rule: 4-5 positive, 3 neutral, 1-2 attention, null unrated', () => {
    const split = sentimentSplit([
      makeItem({ rating: 5 }),
      makeItem({ rating: 4 }),
      makeItem({ rating: 3 }),
      makeItem({ rating: 2 }),
      makeItem({ rating: 1 }),
      makeItem({ rating: null }),
      makeItem({ rating: null }),
    ]);
    expect(split).toEqual({ positive: 2, neutral: 1, attention: 2, unrated: 2 });
  });

  it('keeps nulls out of the rated denominator used for percentages', () => {
    const split = sentimentSplit([makeItem({ rating: 4 }), makeItem({ rating: null })]);
    const rated = split.positive + split.neutral + split.attention;
    expect(split.unrated).toBe(1);
    expect(rated).toBe(1); // 100% positive, not 50%
    expect(Math.round((split.positive / rated) * 100)).toBe(100);
  });

  it('reports everything unrated when no ratings exist', () => {
    expect(sentimentSplit([])).toEqual({ positive: 0, neutral: 0, attention: 0, unrated: 0 });
    expect(sentimentSplit([makeItem({ rating: null })])).toEqual({
      positive: 0,
      neutral: 0,
      attention: 0,
      unrated: 1,
    });
  });
});

describe('seriesToPath', () => {
  it('returns empty paths and max 0 for no points', () => {
    expect(seriesToPath([], 100, 50)).toEqual({ line: '', area: '', max: 0 });
  });

  it('returns empty paths when every value is zero', () => {
    const result = seriesToPath(
      [
        { label: 'a', value: 0 },
        { label: 'b', value: 0 },
      ],
      100,
      50
    );
    expect(result).toEqual({ line: '', area: '', max: 0 });
  });

  it('clamps max at 0 for negative values', () => {
    const result = seriesToPath([{ label: 'a', value: -3 }], 100, 50);
    expect(result.max).toBe(0);
    expect(result.line).toBe('');
  });

  it('draws a single point as a flat, closed line', () => {
    const result = seriesToPath([{ label: 'a', value: 4 }], 100, 50, 10);
    expect(result.max).toBe(4);
    expect(result.line.startsWith('M')).toBe(true);
    expect(result.area.endsWith('Z')).toBe(true);
    expect(result.line).not.toContain('NaN');
    expect(result.area).not.toContain('NaN');
  });

  it('builds a valid multi-point line and closing area', () => {
    const result = seriesToPath(
      [
        { label: 'a', value: 1 },
        { label: 'b', value: 3 },
        { label: 'c', value: 2 },
      ],
      100,
      50,
      10
    );
    expect(result.max).toBe(3);
    expect(result.line.startsWith('M')).toBe(true);
    expect(result.line).toContain('L');
    expect(result.area.endsWith('Z')).toBe(true);
    expect(result.line).not.toContain('NaN');
    expect(result.area).not.toContain('NaN');
  });
});

describe('barGeometry', () => {
  it('returns baseline-aligned zero bars for zero counts', () => {
    const bars = barGeometry([0, 0, 0], 300, 200, 20);
    expect(bars).toHaveLength(3);
    for (const bar of bars) {
      expect(bar.h).toBe(0);
      expect(bar.y).toBe(180); // height - pad
      expect(bar.h).toBeGreaterThanOrEqual(0);
    }
  });

  it('lets a single bar fill the width minus padding', () => {
    const [bar] = barGeometry([7], 400, 200, 20);
    expect(bar).toMatchObject({ x: 20, w: 360, count: 7, index: 0 });
    expect(bar.h).toBeGreaterThan(0);
  });

  it('gives equal counts equal geometry within bounds', () => {
    const bars = barGeometry([2, 2, 2, 2, 2], 560, 240, 32);
    const [first] = bars;
    for (const bar of bars) {
      expect(bar.h).toBe(first.h);
      expect(bar.w).toBe(first.w);
      expect(bar.y + bar.h).toBe(208); // bottom-aligned at height - pad
      expect(bar.x).toBeGreaterThanOrEqual(32);
      expect(bar.x + bar.w).toBeLessThanOrEqual(528);
    }
  });

  it('returns an empty array for no counts', () => {
    expect(barGeometry([], 300, 200)).toEqual([]);
  });
});

describe('formatDayLabel', () => {
  it('renders a short month-day shape', () => {
    expect(formatDayLabel('2026-10-18')).toMatch(/^[A-Za-z]{3} \d{1,2}$/);
  });

  it('reads calendar dates as local dates, with no UTC day shift', () => {
    const expected = new Date(2026, 9, 18).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
    expect(formatDayLabel('2026-10-18')).toBe(expected);
  });

  it('returns an empty string for unparseable input', () => {
    expect(formatDayLabel('not-a-date')).toBe('');
  });
});
