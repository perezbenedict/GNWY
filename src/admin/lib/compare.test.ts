import { describe, expect, it } from 'vitest';
import { NEXT_OPTIONS } from '../../screens/NextScreen';
import type { FeedbackItem } from '../types';
import { compareDays, serviceDayKeys } from './compare';

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

describe('serviceDayKeys', () => {
  it('sorts ascending and dedupes across a local midnight boundary', () => {
    const keys = serviceDayKeys([
      makeItem({ created_at: atLocal(0, 0, 1) }),
      makeItem({ created_at: atLocal(1, 23, 59) }),
      makeItem({ created_at: atLocal(0, 13, 30) }),
    ]);
    expect(keys).toEqual([keyOf(localDay(1)), keyOf(localDay(0))]);
  });

  it('returns an empty list for empty or unparseable input', () => {
    expect(serviceDayKeys([])).toEqual([]);
    expect(serviceDayKeys([makeItem({ created_at: 'not-a-date' })])).toEqual([]);
  });
});

describe('compareDays', () => {
  it('ignores unparseable dates and treats null ratings as unrated', () => {
    const result = compareDays(
      [
        makeItem({ created_at: 'not-a-date', rating: 5 }),
        makeItem({ created_at: atLocal(0, 9, 0), rating: null }),
      ],
      keyOf(localDay(0)),
      keyOf(localDay(1)),
    );
    expect(result.countA).toBe(1);
    expect(result.avgA).toBeNull(); // items present, but every rating null
    expect(result.positiveA).toBe(0);
    expect(result.countB).toBe(0); // unparseable date dropped
  });

  it('computes counts, averages and positive pct over non-null ratings only', () => {
    const result = compareDays(
      [
        makeItem({ created_at: atLocal(1, 9, 0), rating: 5 }),
        makeItem({ created_at: atLocal(1, 10, 0), rating: 4 }),
        makeItem({ created_at: atLocal(1, 11, 0), rating: null }),
        makeItem({ created_at: atLocal(1, 12, 0), rating: 3 }),
        makeItem({ created_at: atLocal(1, 13, 0), rating: 2 }),
        makeItem({ created_at: atLocal(0, 9, 0), rating: 5 }),
        makeItem({ created_at: atLocal(0, 10, 0), rating: 4 }),
        makeItem({ created_at: atLocal(0, 11, 0), rating: 2 }),
      ],
      keyOf(localDay(1)),
      keyOf(localDay(0)),
    );
    expect(result.countA).toBe(5);
    expect(result.avgA).toBe(3.5); // (5 + 4 + 3 + 2) / 4, null excluded
    expect(result.positiveA).toBe(50); // 2 of 4 rated are 4-5
    expect(result.countB).toBe(3);
    expect(result.avgB).toBe(3.7); // 11 / 3 rounded to 1 decimal
    expect(result.positiveB).toBe(67); // 2 of 3 rated are 4-5
  });

  it('picks the most frequent category and suggestion chip', () => {
    const result = compareDays(
      [
        makeItem({ created_at: atLocal(1, 9, 0), categories: 'Worship, Other' }),
        makeItem({ created_at: atLocal(1, 10, 0), categories: 'Worship, The Word' }),
        makeItem({ created_at: atLocal(1, 11, 0), categories: 'Worship' }),
        makeItem({
          created_at: atLocal(1, 12, 0),
          suggestions: `${NEXT_OPTIONS[0]}, ${NEXT_OPTIONS[1]}`,
        }),
        makeItem({
          created_at: atLocal(1, 13, 0),
          suggestions: `${NEXT_OPTIONS[0]} - make it monthly`,
        }),
      ],
      keyOf(localDay(1)),
      keyOf(localDay(0)),
    );
    expect(result.topCategoryA).toBe('Worship');
    expect(result.topActivityA).toBe(NEXT_OPTIONS[0]); // note tail stripped, chip counted
    expect(result.topCategoryB).toBeNull();
    expect(result.topActivityB).toBeNull();
  });

  it('returns nulls and zeros for an empty day side', () => {
    const result = compareDays(
      [makeItem({ created_at: atLocal(0, 9, 0), rating: 5, categories: 'Worship' })],
      keyOf(localDay(5)),
      keyOf(localDay(0)),
    );
    expect(result.countA).toBe(0);
    expect(result.avgA).toBeNull();
    expect(result.positiveA).toBe(0);
    expect(result.topCategoryA).toBeNull();
    expect(result.topActivityA).toBeNull();
    expect(result.countB).toBe(1);
    expect(result.avgB).toBe(5);
    expect(result.positiveB).toBe(100);
    expect(result.topCategoryB).toBe('Worship');
  });
});
