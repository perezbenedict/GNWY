import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Emblem } from '../components/Emblem';
import { Gate } from './components/Gate';
import { Topbar } from './components/Topbar';
import { StatCards } from './components/StatCards';
import { FilterBar } from './components/FilterBar';
import { FeedbackList } from './components/FeedbackList';
import {
  clearToken,
  discardFeedback,
  exportCsv,
  getToken,
  listFeedback,
  setToken,
  VaultError,
} from './api';
import type { FeedbackItem, Summary } from './types';

const AUTH_ERROR = 'Access key not recognized.';

// Fixed atmosphere. Kept as a SIBLING of the animated views: motion leaves filter/transform
// styles on wrappers, and any filter would turn that wrapper into the containing block for
// position:fixed children, breaking viewport-fixed positioning.
function Atmosphere() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <div
        className="absolute left-1/2 top-[-12%] h-[520px] w-[900px] max-w-[140vw] -translate-x-1/2 rounded-full opacity-10 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(232,199,122,1), transparent 65%)' }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Emblem className="h-[70vmin] w-[70vmin] opacity-[0.04]" />
      </div>
    </div>
  );
}

export function App() {
  const [screen, setScreen] = useState<'gate' | 'dashboard'>(() => (getToken() ? 'dashboard' : 'gate'));
  const [gateError, setGateError] = useState('');
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(() => getToken() !== '');
  const [listError, setListError] = useState('');
  const [exporting, setExporting] = useState(false);

  const [query, setQuery] = useState('');
  const [minRating, setMinRating] = useState('');
  const [category, setCategory] = useState('');
  const applied = useRef({ q: '', minRating: '', category: '' });

  // A 401 anywhere drops back to the gate and shows the auth message.
  const handleFailure = useCallback((err: unknown): boolean => {
    if (err instanceof VaultError && err.message === AUTH_ERROR) {
      clearToken();
      setScreen('gate');
      setGateError(AUTH_ERROR);
      return true;
    }
    setListError(err instanceof Error && err.message ? err.message : 'Could not load responses.');
    return false;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      const data = await listFeedback(applied.current);
      setItems(Array.isArray(data.items) ? data.items : []);
      setSummary(data.summary ?? null);
    } catch (err) {
      handleFailure(err);
    } finally {
      setLoading(false);
    }
  }, [handleFailure]);

  // Load once each time the dashboard becomes active (initial mount with a stored token, or unlock).
  useEffect(() => {
    if (screen === 'dashboard') load();
  }, [screen, load]);

  // Debounced search; immediate reload when a select or Clear changes the applied filters.
  useEffect(() => {
    if (screen !== 'dashboard') return;
    const trimmed = query.trim();
    if (trimmed === applied.current.q) return;
    const timer = window.setTimeout(() => {
      applied.current.q = trimmed;
      load();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, screen, load]);

  const handleUnlock = (raw: string) => {
    const key = raw.trim();
    if (!key) {
      setGateError(AUTH_ERROR);
      return;
    }
    setToken(key);
    setGateError('');
    setLoading(true);
    setScreen('dashboard');
  };

  const handleLock = () => {
    clearToken();
    setGateError('');
    setScreen('gate');
  };

  const changeMinRating = (value: string) => {
    setMinRating(value);
    applied.current.minRating = value;
    load();
  };

  const changeCategory = (value: string) => {
    setCategory(value);
    applied.current.category = value;
    load();
  };

  const clearFilters = () => {
    setQuery('');
    setMinRating('');
    setCategory('');
    applied.current = { q: '', minRating: '', category: '' };
    load();
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await exportCsv();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'feedback-export.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      handleFailure(err);
    } finally {
      setExporting(false);
    }
  };

  const handleDiscard = async (id: string) => {
    if (!window.confirm('Discard this response? This cannot be undone.')) return;
    try {
      await discardFeedback(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setSummary((prev) => (prev ? { ...prev, total: Math.max(0, prev.total - 1) } : prev));
    } catch (err) {
      handleFailure(err);
    }
  };

  return (
    <div className="min-h-[100dvh]">
      <Atmosphere />
      <AnimatePresence mode="wait">
        {screen === 'gate' ? (
          <motion.div
            key="gate"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            <Gate error={gateError} onSubmit={handleUnlock} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="min-h-[100dvh]"
          >
            <Topbar onLock={handleLock} />
            <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6">
              <StatCards summary={summary} />
              <FilterBar
                query={query}
                minRating={minRating}
                category={category}
                onQueryChange={setQuery}
                onMinRatingChange={changeMinRating}
                onCategoryChange={changeCategory}
                onClear={clearFilters}
              />
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting}
                  className="inline-flex h-11 items-center rounded-xl bg-gradient-to-r from-yellow via-lavender to-[#B8862F] px-5 text-xs font-semibold uppercase tracking-[0.18em] text-midnight transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-lavender/60 focus:ring-offset-2 focus:ring-offset-midnight disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => load()}
                  className="inline-flex h-11 items-center rounded-xl border border-white/10 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted transition hover:border-lavender/40 hover:text-ink focus:outline-none focus:ring-2 focus:ring-lavender/40"
                >
                  Refresh
                </button>
              </div>
              <FeedbackList
                loading={loading}
                error={listError}
                items={items}
                onRetry={load}
                onDiscard={handleDiscard}
              />
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
