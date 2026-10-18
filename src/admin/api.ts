import type { FeedbackItem, Summary } from './types';

const FEEDBACK_API = 'https://gnwy-feedback.perezbenedict007.workers.dev'; // deployed Worker API
const TOKEN_KEY = 'gnwy_admin_token';

export class VaultError extends Error {}

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(value: string): void {
  localStorage.setItem(TOKEN_KEY, value);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function apiUrl(path: string): string {
  return FEEDBACK_API.replace(/\/+$/, '') + path;
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set('Authorization', 'Bearer ' + token);

  let res: Response;
  try {
    res = await fetch(apiUrl(path), { ...options, headers });
  } catch {
    throw new VaultError('Could not reach the server. Check your connection and try again.');
  }

  // The caller clears the token and returns to the gate on auth failure.
  if (res.status === 401) throw new VaultError('Access key not recognized.');
  if (!res.ok) throw new VaultError(`Request failed (status ${res.status}).`);
  return res;
}

export interface VaultFilters {
  q: string;
  minRating: string;
  maxRating?: string;
  category: string;
  dateFrom?: string;
  dateTo?: string;
  followUp?: 'all' | 'with';
}

function filterParams(filters: VaultFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.minRating) params.set('minRating', filters.minRating);
  if (filters.maxRating) params.set('maxRating', filters.maxRating);
  if (filters.category) params.set('category', filters.category);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.followUp && filters.followUp !== 'all') params.set('followUp', filters.followUp);
  return params;
}

export async function listFeedback(filters: VaultFilters): Promise<{ items: FeedbackItem[]; summary: Summary }> {
  const query = filterParams(filters).toString();
  const res = await apiFetch('/api/feedback' + (query ? '?' + query : ''));
  return res.json();
}

export async function exportCsv(filters: VaultFilters): Promise<Response> {
  const query = filterParams(filters).toString();
  return apiFetch('/api/feedback/export.csv' + (query ? '?' + query : ''));
}

export async function discardFeedback(id: string, reauth: string): Promise<void> {
  // Not apiFetch: the 401 body distinguishes a rejected reauth key (nothing
  // deleted, stay in the dialog) from an expired session token (drop to gate).
  let res: Response;
  try {
    res = await fetch(apiUrl('/api/feedback/' + encodeURIComponent(id)), {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + getToken(),
        'X-Reauth': reauth,
      },
    });
  } catch {
    throw new VaultError('Could not reach the server. Check your connection and try again.');
  }

  if (res.status === 401) {
    let code = '';
    try {
      code = ((await res.json()) as { error?: string }).error || '';
    } catch {
      // non-JSON body; fall through to the generic auth error
    }
    if (code === 'reauth_required' || code === 'reauth_failed') {
      throw new VaultError('Access key not recognized. Nothing was discarded.');
    }
    throw new VaultError('Access key not recognized.');
  }
  if (!res.ok) {
    let message = '';
    try {
      message = ((await res.json()) as { error?: string }).error || '';
    } catch {
      // non-JSON body; fall through to the status message
    }
    throw new VaultError(message || `Request failed (status ${res.status}).`);
  }
}

export async function bulkDiscard(
  ids: string[],
  reauth: string
): Promise<{ discarded: string[]; failed: { id: string; error: string }[] }> {
  // Not apiFetch: it throws a generic error on any 401 before the response
  // body is readable, and here the body tells us whether the reauth key was
  // rejected (nothing deleted) versus the stored token expiring.
  let res: Response;
  try {
    res = await fetch(apiUrl('/api/feedback/discard'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + getToken(),
        'X-Reauth': reauth,
      },
      body: JSON.stringify({ ids }),
    });
  } catch {
    throw new VaultError('Could not reach the server. Check your connection and try again.');
  }

  if (res.status === 401) {
    let code = '';
    try {
      code = ((await res.json()) as { error?: string }).error || '';
    } catch {
      // non-JSON body; fall through to the generic auth error
    }
    if (code === 'reauth_required' || code === 'reauth_failed') {
      throw new VaultError('Access key not recognized. Nothing was discarded.');
    }
    throw new VaultError('Access key not recognized.');
  }
  if (!res.ok) {
    let message = '';
    try {
      message = ((await res.json()) as { error?: string }).error || '';
    } catch {
      // non-JSON body; fall through to the status message
    }
    throw new VaultError(message || `Request failed (status ${res.status}).`);
  }
  return res.json();
}
