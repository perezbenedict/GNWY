import { describe, expect, it } from 'vitest';
import { IMPROVE_OPTIONS } from '../../screens/ImproveScreen';
import { NEXT_OPTIONS } from '../../screens/NextScreen';
import type { FeedbackItem } from '../types';
import { computeOverview } from './overview';

function item(overrides: Partial<FeedbackItem> = {}): FeedbackItem {
  return {
    id: 'id-1',
    created_at: new Date(2026, 9, 5, 12).toISOString(),
    rating: null,
    categories: '',
    liked: '',
    disliked: '',
    suggestions: '',
    expectations: '',
    name: '',
    contact: '',
    ...overrides,
  };
}

describe('computeOverview sentiment', () => {
  it('buckets 4-5 positive, 3 neutral, 1-2 negative and excludes null ratings from denominators', () => {
    const stats = computeOverview([
      item({ rating: 5 }),
      item({ rating: 4 }),
      item({ rating: 3 }),
      item({ rating: 2 }),
      item({ rating: 1 }),
      item({ rating: null }),
    ]);
    expect(stats.total).toBe(6);
    expect(stats.rated).toBe(5);
    expect(stats.positive).toBe(2);
    expect(stats.neutral).toBe(1);
    expect(stats.negative).toBe(2);
    expect(stats.positivePct).toBe(40);
    expect(stats.negativePct).toBe(40);
  });

  it('reports zero percentages when nothing is rated', () => {
    const stats = computeOverview([item({ rating: null }), item({ rating: null })]);
    expect(stats.rated).toBe(0);
    expect(stats.positivePct).toBe(0);
    expect(stats.negativePct).toBe(0);
  });
});

describe('computeOverview averages', () => {
  it('rounds avgRating to one decimal over non-null ratings only', () => {
    expect(computeOverview([item({ rating: 4 }), item({ rating: 5 })]).avgRating).toBe(4.5);
    expect(
      computeOverview([item({ rating: 4 }), item({ rating: 4 }), item({ rating: 5 })]).avgRating,
    ).toBe(4.3);
    expect(
      computeOverview([item({ rating: 5 }), item({ rating: null })]).avgRating,
    ).toBe(5);
  });

  it('is null when no item is rated', () => {
    expect(computeOverview([]).avgRating).toBeNull();
    expect(computeOverview([item({ rating: null })]).avgRating).toBeNull();
  });
});

describe('computeOverview topCategory', () => {
  it('dedupes categories case-insensitively within and across items', () => {
    const stats = computeOverview([
      item({ categories: 'Worship' }),
      item({ categories: 'worship, The Word' }),
      item({ categories: 'WORSHIP, The Word' }),
    ]);
    expect(stats.topCategory).toEqual({ label: 'Worship', count: 3 });
  });

  it('trims tokens and returns null with no categories', () => {
    expect(
      computeOverview([item({ categories: ' Production & Sound , Other ' })]).topCategory,
    ).toEqual({ label: 'Production & Sound', count: 1 });
    expect(computeOverview([item({ categories: '' })]).topCategory).toBeNull();
  });
});

describe('computeOverview chip matching', () => {
  it('matches suggestions against NEXT_OPTIONS and disliked against IMPROVE_OPTIONS', () => {
    const stats = computeOverview([
      item({ suggestions: 'More worship sessions \u{1F3B6}, More youth hangouts \u{1F389}' }),
      item({ suggestions: 'More worship sessions \u{1F3B6} - weekly please' }),
      item({ disliked: 'The timing \u23F0 - start on time' }),
      item({ disliked: 'The timing \u23F0' }),
      item({ disliked: 'free text only' }),
    ]);
    expect(stats.topActivity).toEqual({ label: 'More worship sessions \u{1F3B6}', count: 2 });
    expect(stats.topComplaint).toEqual({ label: 'The timing \u23F0', count: 2 });
  });
});

describe('computeOverview comment and follow-up counts', () => {
  it("counts items with the ' - ' free-text marker or non-empty expectations", () => {
    const stats = computeOverview([
      item({ liked: 'The Word spoke to me \u{1F4D6} - it hit home' }),
      item({ disliked: 'The timing \u23F0' }),
      item({ suggestions: 'The message \u{1F4D6} - deeper series' }),
      item({ expectations: ' more parking ' }),
      item({ expectations: '   ' }),
      item({ liked: 'chips only, no comment' }),
    ]);
    expect(stats.withComments).toBe(3);
  });

  it('counts follow-up opt-ins, excluding whitespace-only contact, and rounds the percentage', () => {
    expect(
      computeOverview([item({ contact: 'a@b.co' }), item({ contact: '   ' }), item({ contact: '' })]),
    ).toMatchObject({ followUps: 1, followUpPct: 33 });
    expect(
      computeOverview([
        item({ contact: 'a@b.co' }),
        item({ contact: '  +1 555 000  ' }),
        item({ contact: '   ' }),
        item({ contact: '' }),
      ]),
    ).toMatchObject({ followUps: 2, followUpPct: 50 });
  });
});

describe('computeOverview dayComparison', () => {
  it('is null with zero or one distinct local day', () => {
    expect(computeOverview([]).dayComparison).toBeNull();
    const stats = computeOverview([
      item({ created_at: new Date(2026, 9, 4, 9).toISOString() }),
      item({ created_at: new Date(2026, 9, 4, 18).toISOString() }),
    ]);
    expect(stats.dayComparison).toBeNull();
  });

  it('compares the latest day with the previous distinct day', () => {
    const stats = computeOverview([
      item({ created_at: new Date(2026, 9, 3, 10).toISOString(), rating: 5 }),
      item({ created_at: new Date(2026, 9, 3, 20).toISOString(), rating: 4 }),
      item({ created_at: new Date(2026, 9, 5, 10).toISOString(), rating: 3 }),
      item({ created_at: new Date(2026, 9, 5, 11).toISOString(), rating: null }),
      item({ created_at: new Date(2026, 9, 4, 12).toISOString(), rating: 2 }),
    ]);
    expect(stats.dayComparison).toEqual({
      currentDay: '2026-10-05',
      previousDay: '2026-10-04',
      countDelta: 1,
      avgDelta: 1,
    });
  });

  it('nulls avgDelta when either day has no rated items', () => {
    const stats = computeOverview([
      item({ created_at: new Date(2026, 9, 3, 10).toISOString(), rating: 5 }),
      item({ created_at: new Date(2026, 9, 4, 10).toISOString(), rating: null }),
    ]);
    expect(stats.dayComparison).toEqual({
      currentDay: '2026-10-04',
      previousDay: '2026-10-03',
      countDelta: 0,
      avgDelta: null,
    });
  });

  it('computes negative deltas when the latest day is quieter', () => {
    const stats = computeOverview([
      item({ created_at: new Date(2026, 9, 3, 10).toISOString(), rating: 2 }),
      item({ created_at: new Date(2026, 9, 3, 11).toISOString(), rating: 4 }),
      item({ created_at: new Date(2026, 9, 4, 10).toISOString(), rating: 5 }),
    ]);
    expect(stats.dayComparison).toEqual({
      currentDay: '2026-10-04',
      previousDay: '2026-10-03',
      countDelta: -1,
      avgDelta: 2,
    });
  });
});

describe('computeOverview with zero items', () => {
  it('returns zeros and nulls without dividing by zero', () => {
    expect(computeOverview([])).toEqual({
      total: 0,
      avgRating: null,
      rated: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      positivePct: 0,
      negativePct: 0,
      topCategory: null,
      topActivity: null,
      topComplaint: null,
      // add the new ranking fields so this exact-shape assertion stays honest
      topRequests: [],
      topComplaints: [],
      withComments: 0,
      followUps: 0,
      followUpPct: 0,
      dayComparison: null,
    });
  });
});

describe('computeOverview topRequests and topComplaints', () => {
  it('counts NextScreen chips once per response, ignoring free-text tails and case', () => {
    const youth = NEXT_OPTIONS[0];
    const worship = NEXT_OPTIONS[1];
    const stats = computeOverview([
      item({ suggestions: `${worship}, ${youth}` }),
      item({ suggestions: `${youth} - make it monthly` }),
      item({ suggestions: youth.toLowerCase() }),
      // Repeated chip within one response still votes only once.
      item({ suggestions: `${youth}, ${youth}, ${worship}` }),
    ]);
    expect(stats.topRequests).toEqual([
      { label: youth, count: 4 },
      { label: worship, count: 2 },
    ]);
  });

  it('counts ImproveScreen chips from disliked, breaking count ties by label ascending', () => {
    const sound = IMPROVE_OPTIONS[0];
    const timing = IMPROVE_OPTIONS[1];
    const stats = computeOverview([
      item({ disliked: `${sound}, ${timing}` }),
      item({ disliked: `${timing} - far too late` }),
      item({ disliked: sound.toUpperCase() }),
    ]);
    expect(stats.topComplaints).toEqual([
      { label: sound, count: 2 },
      { label: timing, count: 2 },
    ]);
  });

  it('caps topRequests at five entries, dropping the smallest count', () => {
    const six = NEXT_OPTIONS.slice(0, 6);
    const stats = computeOverview(
      six.map((_, index) => item({ suggestions: six.slice(0, six.length - index).join(', ') })),
    );
    expect(stats.topRequests).toHaveLength(5);
    expect(stats.topRequests.map((entry) => entry.count)).toEqual([6, 5, 4, 3, 2]);
    expect(stats.topRequests.map((entry) => entry.label)).toEqual(six.slice(0, 5));
  });

  it('caps topComplaints at five entries as well', () => {
    const six = IMPROVE_OPTIONS.slice(0, 6);
    const stats = computeOverview(
      six.map((_, index) => item({ disliked: six.slice(0, six.length - index).join(', ') })),
    );
    expect(stats.topComplaints).toHaveLength(5);
    expect(stats.topComplaints.map((entry) => entry.count)).toEqual([6, 5, 4, 3, 2]);
    expect(stats.topComplaints.map((entry) => entry.label)).toEqual(six.slice(0, 5));
  });

  it('excludes options with zero counts, keeping only counts > 0', () => {
    const stats = computeOverview([
      item({ suggestions: 'just free-form text', disliked: 'a generic gripe' }),
      item({ suggestions: `${NEXT_OPTIONS[2]} - fully agree`, disliked: `${IMPROVE_OPTIONS[3]}` }),
    ]);
    expect(stats.topRequests).toEqual([{ label: NEXT_OPTIONS[2], count: 1 }]);
    expect(stats.topComplaints).toEqual([{ label: IMPROVE_OPTIONS[3], count: 1 }]);
  });

  it('returns empty rankings when there are no responses', () => {
    expect(computeOverview([]).topRequests).toEqual([]);
    expect(computeOverview([]).topComplaints).toEqual([]);
  });
});
