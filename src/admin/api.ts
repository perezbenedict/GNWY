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

export async function listFeedback(filters: {
  q: string;
  minRating: string;
  category: string;
}): Promise<{ items: FeedbackItem[]; summary: Summary }> {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.minRating) params.set('minRating', filters.minRating);
  if (filters.category) params.set('category', filters.category);
  const query = params.toString();
  const res = await apiFetch('/api/feedback' + (query ? '?' + query : ''));
  return res.json();
}

export async function exportCsv(): Promise<Response> {
  return apiFetch('/api/feedback/export.csv');
}

export async function discardFeedback(id: string): Promise<Response> {
  return apiFetch('/api/feedback/' + encodeURIComponent(id), { method: 'DELETE' });
}
