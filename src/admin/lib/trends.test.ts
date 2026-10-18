import { describe, expect, it } from 'vitest';
import type { FeedbackItem } from '../types';
import { contactRate, dailySeries, momentum, timeOfDay } from './trends';

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

function localDay(offsetDays: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - offsetDays);
  return date;
}

function keyOf(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function atLocal(offsetDays: number, hours: number, minutes: number): string {
  const date = localDay(offsetDays);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

describe('dailySeries', () => {
  it('spans exactly 14 local days, oldest first, ending today', () => {
    const series = dailySeries([]);
    expect(series).toHaveLength(14);
    expect(series[13].key).toBe(keyOf(new Date()));
    series.forEach((entry, i) => {
      expect(entry.key).toBe(keyOf(localDay(13 - i)));
      expect(entry.count).toBe(0);
      expect(entry.avgRating).toBeNull();
    });
  });

  it('buckets counts across a local midnight boundary', () => {
    const series = dailySeries([
      makeItem({ created_at: atLocal(1, 23, 59) }),
      makeItem({ created_at: atLocal(0, 0, 1) }),
    ]);
    const yesterday = series.find((entry) => entry.key === keyOf(localDay(1)));
    const today = series.find((entry) => entry.key === keyOf(localDay(0)));
    expect(yesterday?.count).toBe(1);
    expect(today?.count).toBe(1);
    const total = series.reduce((sum, entry) => sum + entry.count, 0);
    expect(total).toBe(2);
  });

  it('returns null avgRating for empty days, excludes null ratings, rounds to 1 decimal', () => {
    const series = dailySeries([
      makeItem({ created_at: atLocal(0, 10, 0), rating: 4 }),
      makeItem({ created_at: atLocal(0, 11, 0), rating: 5 }),
      makeItem({ created_at: atLocal(0, 12, 0), rating: null }),
      makeItem({ created_at: atLocal(3, 9, 0), rating: 4 }),
      makeItem({ created_at: atLocal(3, 9, 30), rating: 4 }),
      makeItem({ created_at: atLocal(3, 10, 0), rating: 5 }),
    ]);
    expect(series[13].avgRating).toBe(4.5); // (4 + 5) / 2, null rating excluded
    expect(series[10].avgRating).toBe(4.3); // 13 / 3 rounded to 1 decimal
    expect(series[5].avgRating).toBeNull(); // day with no items

    const allNull = dailySeries([makeItem({ created_at: atLocal(2, 8, 0), rating: null })]);
    expect(allNull[11].avgRating).toBeNull(); // items present but every rating null
  });

  it('ignores unparseable dates', () => {
    const series = dailySeries([makeItem({ created_at: 'not-a-date' })]);
    const total = series.reduce((sum, entry) => sum + entry.count, 0);
    expect(total).toBe(0);
    expect(series.every((entry) => entry.avgRating === null)).toBe(true);
  });
});

describe('timeOfDay', () => {
  it('splits on local hour edges 12, 17', () => {
    const buckets = timeOfDay([
      makeItem({ created_at: atLocal(0, 11, 59) }),
      makeItem({ created_at: atLocal(0, 12, 0) }),
      makeItem({ created_at: atLocal(0, 16, 59) }),
      makeItem({ created_at: atLocal(0, 17, 0) }),
      makeItem({ created_at: 'not-a-date' }),
    ]);
    expect(buckets).toEqual({ morning: 1, afternoon: 2, evening: 1 });
  });
});

describe('contactRate', () => {
  it('returns 0 pct with no items', () => {
    expect(contactRate([])).toEqual({ withContact: 0, total: 0, pct: 0 });
  });

  it('counts trimmed contacts and rounds pct', () => {
    const result = contactRate([
      makeItem({ contact: '  a@b.c ' }),
      makeItem({ contact: '' }),
      makeItem({ contact: '   ' }),
      makeItem({ contact: 'x' }),
    ]);
    expect(result).toEqual({ withContact: 2, total: 4, pct: 50 });
  });
});

describe('momentum', () => {
  it('returns 0 delta when there is no activity at all', () => {
    expect(momentum([])).toEqual({ current7: 0, previous7: 0, deltaPct: 0 });
  });

  it('returns null delta when previous7 is 0 but current7 is not', () => {
    const result = momentum([makeItem({ created_at: atLocal(0, 9, 0) })]);
    expect(result.current7).toBe(1);
    expect(result.previous7).toBe(0);
    expect(result.deltaPct).toBeNull();
  });

  it('computes a normal percentage change across the two 7-day windows', () => {
    const result = momentum([
      makeItem({ created_at: atLocal(0, 9, 0) }),
      makeItem({ created_at: atLocal(1, 9, 0) }),
      makeItem({ created_at: atLocal(2, 9, 0) }),
      makeItem({ created_at: atLocal(3, 9, 0) }),
      makeItem({ created_at: atLocal(8, 9, 0) }),
      makeItem({ created_at: atLocal(13, 9, 0) }),
    ]);
    expect(result).toEqual({ current7: 4, previous7: 2, deltaPct: 100 });
  });
});
