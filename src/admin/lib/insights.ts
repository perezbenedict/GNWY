// Pure counting helpers for the Response polls section.

export function countKnownLabels(
  field: string | null | undefined,
  known: readonly string[],
): { counts: Array<{ label: string; count: number }>; freeText: string[] } {
  const counts: Array<{ label: string; count: number }> = [];
  const freeText: string[] = [];
  if (!field || !field.trim()) return { counts, freeText };

  const canonicalByLower = new Map<string, string>();
  for (const label of known) canonicalByLower.set(label.trim().toLowerCase(), label);

  const seenFree = new Set<string>();
  const matched = new Set<string>();

  const addFree = (raw: string): void => {
    const token = raw.trim();
    if (token && !seenFree.has(token)) {
      seenFree.add(token);
      freeText.push(token);
    }
  };

  // buildPayload joins labels with ', ' but appends free text after ' - ',
  // so a chip and its comment can share one comma-delimited token.
  const consumeToken = (raw: string): void => {
    const token = raw.trim();
    if (!token) return;
    const exact = canonicalByLower.get(token.toLowerCase());
    if (exact !== undefined) {
      matched.add(exact);
      return;
    }
    const separator = token.indexOf(' - ');
    if (separator !== -1) {
      const head = canonicalByLower.get(token.slice(0, separator).trim().toLowerCase());
      if (head !== undefined) {
        matched.add(head);
        addFree(token.slice(separator + 3));
        return;
      }
    }
    addFree(token);
  };

  if (known.some((label) => label.includes(', '))) {
    // A known label itself contains ', ', so naive comma splitting would
    // shred it: scan left to right, always taking the longest label match.
    const longestFirst = [...known]
      .sort((a, b) => b.length - a.length)
      .map((label) => ({ label, lower: label.toLowerCase() }));
    const lower = field.toLowerCase();
    let pos = 0;
    let remainder = '';
    const flushRemainder = (): void => {
      for (const part of remainder.split(',')) addFree(part);
      remainder = '';
    };
    while (pos < field.length) {
      const hit = longestFirst.find((candidate) => lower.startsWith(candidate.lower, pos));
      if (hit !== undefined) {
        flushRemainder();
        matched.add(hit.label);
        pos += hit.label.length;
        // Skip the ', ' / ' - ' joiners that sit between labels and text.
        const separator = /^(?:[\s,]+|-\s+)+/.exec(field.slice(pos));
        if (separator !== null) pos += separator[0].length;
      } else {
        remainder += field[pos];
        pos += 1;
      }
    }
    flushRemainder();
  } else {
    for (const token of field.split(',')) consumeToken(token);
  }

  // A field is one response, so each label contributes at most 1.
  const sorted = [...matched].map((label) => ({ label, count: 1 }));
  sorted.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  return { counts: sorted, freeText };
}

export function topN<T>(entries: T[], n: number): T[] {
  const limit = Math.max(0, Math.floor(n));
  return entries.slice(0, limit);
}
