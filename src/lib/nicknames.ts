// Pure helpers for the nickname generator (no React, no fetch).
export function pickSuggestion(
  pool: readonly string[],
  last: string | null,
  used: ReadonlySet<string>
): string | null {
  const candidates = pool.filter((name) => name !== last && !used.has(name));
  const fallback = pool.filter((name) => !used.has(name));
  const source = candidates.length > 0 ? candidates : fallback;
  if (source.length === 0) return null;
  return source[Math.floor(Math.random() * source.length)] ?? null;
}

// Defensive parse of the Worker's { used: string[] } shape; garbage yields an empty set.
export function normalizeUsed(raw: unknown): Set<string> {
  const used = new Set<string>();
  if (!raw || typeof raw !== 'object') return used;
  const list = (raw as { used?: unknown }).used;
  if (!Array.isArray(list)) return used;
  for (const item of list) {
    if (typeof item === 'string' && item.trim()) used.add(item.trim());
  }
  return used;
}
