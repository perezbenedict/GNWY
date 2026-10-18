import { normalizeUsed } from '../lib/nicknames';
import { FEEDBACK_API } from './submit';

// Best-effort: any failure (network, non-ok, abort) yields an empty set, never throws.
export async function fetchUsedNicknames(): Promise<Set<string>> {
  try {
    const options: RequestInit = { headers: { Accept: 'application/json' } };
    if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
      options.signal = (AbortSignal as { timeout?: (ms: number) => AbortSignal }).timeout?.(4000);
    }
    const res = await fetch(FEEDBACK_API + '/api/nicknames/used', options);
    if (!res.ok) return new Set();
    return normalizeUsed(await res.json());
  } catch {
    return new Set();
  }
}
