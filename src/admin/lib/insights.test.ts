import { describe, expect, it } from 'vitest';
import { countKnownLabels, topN } from './insights';

const KNOWN = [
  'The worship was something else 🎶',
  'The Word spoke to me 📖',
  'The whole atmosphere ✨',
] as const;

describe('countKnownLabels', () => {
  it('returns empty results for empty, blank or null fields', () => {
    expect(countKnownLabels(null, KNOWN)).toEqual({ counts: [], freeText: [] });
    expect(countKnownLabels(undefined, KNOWN)).toEqual({ counts: [], freeText: [] });
    expect(countKnownLabels('', KNOWN)).toEqual({ counts: [], freeText: [] });
    expect(countKnownLabels('   ', KNOWN)).toEqual({ counts: [], freeText: [] });
  });

  it('counts emoji-bearing labels', () => {
    const result = countKnownLabels(
      'The worship was something else 🎶, The whole atmosphere ✨',
      KNOWN,
    );
    expect(result.freeText).toEqual([]);
    expect(result.counts).toEqual([
      { label: 'The whole atmosphere ✨', count: 1 },
      { label: 'The worship was something else 🎶', count: 1 },
    ]);
  });

  it('separates free-text tokens from known labels', () => {
    const result = countKnownLabels('The Word spoke to me 📖, more lights next time', KNOWN);
    expect(result.counts).toEqual([{ label: 'The Word spoke to me 📖', count: 1 }]);
    expect(result.freeText).toEqual(['more lights next time']);
  });

  it("splits free text appended with ' - ' off its chip label", () => {
    const result = countKnownLabels('The worship was something else 🎶 - the closing song', KNOWN);
    expect(result.counts).toEqual([{ label: 'The worship was something else 🎶', count: 1 }]);
    expect(result.freeText).toEqual(['the closing song']);
  });

  it('trims free text, drops empties and dedupes in order of appearance', () => {
    const result = countKnownLabels('  more coffee  , more coffee ,,   second idea  ', KNOWN);
    expect(result.counts).toEqual([]);
    expect(result.freeText).toEqual(['more coffee', 'second idea']);
  });

  it('matches case-insensitively and counts each label at most once per field', () => {
    const result = countKnownLabels(
      'the WORSHIP was something else 🎶, The Worship Was Something Else 🎶, THE WHOLE ATMOSPHERE ✨',
      KNOWN,
    );
    expect(result.counts).toEqual([
      { label: 'The whole atmosphere ✨', count: 1 },
      { label: 'The worship was something else 🎶', count: 1 },
    ]);
  });

  it('sorts by count desc with an alphabetical tie-break', () => {
    // Counts are capped at 1 per field, so every entry here ties on count.
    const known = ['Beta option', 'Alpha option', 'Gamma option'];
    const result = countKnownLabels('Gamma option, Beta option, Alpha option', known);
    expect(result.counts.map((entry) => entry.count)).toEqual([1, 1, 1]);
    expect(result.counts.map((entry) => entry.label)).toEqual([
      'Alpha option',
      'Beta option',
      'Gamma option',
    ]);
  });

  it('matches comma-containing known labels longest-first', () => {
    const known = ['First, second', 'First'];
    const result = countKnownLabels('First, second and then some free text', known);
    expect(result.counts).toEqual([{ label: 'First, second', count: 1 }]);
    expect(result.freeText).toEqual(['and then some free text']);
  });

  it('matches comma-containing labels case-insensitively with remainder as free text', () => {
    const known = ['Hello, world'];
    const result = countKnownLabels('HELLO, WORLD is what they said', known);
    expect(result.counts).toEqual([{ label: 'Hello, world', count: 1 }]);
    expect(result.freeText).toEqual(['is what they said']);
  });
});

describe('topN', () => {
  it('returns the first n entries', () => {
    expect(topN([1, 2, 3], 2)).toEqual([1, 2]);
  });

  it('is safe for short arrays and non-positive n', () => {
    expect(topN([1, 2], 5)).toEqual([1, 2]);
    expect(topN([], 3)).toEqual([]);
    expect(topN([1, 2, 3], 0)).toEqual([]);
  });
});
