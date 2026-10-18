import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Emblem } from '../components/Emblem';
import { Gate } from './components/Gate';
import { Topbar } from './components/Topbar';
import { StatCards } from './components/StatCards';
import { Insights } from './components/Insights';
import Polls from './components/Polls';
import TrendPanel from './components/TrendPanel';
import Overview from './components/Overview';
import ComparePanel from './components/ComparePanel';
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
import { CATEGORIES, type FeedbackItem, type SortMode, type Summary } from './types';

const AUTH_ERROR = 'Access key not recognized.';

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'responses', label: 'Responses' },
] as const;
type SectionId = (typeof SECTIONS)[number]['id'];

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
  const [sort, setSort] = useState<SortMode>('new');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [followUp, setFollowUp] = useState<'all' | 'with'>('all');
  const [section, setSection] = useState<SectionId>('overview');
  const applied = useRef({ q: '', minRating: '', category: '', dateFrom: '', dateTo: '', followUp: 'all' as 'all' | 'with' });

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

  const changeDateFrom = (value: string) => {
    setDateFrom(value);
    applied.current.dateFrom = value;
    load();
  };

  const changeDateTo = (value: string) => {
    setDateTo(value);
    applied.current.dateTo = value;
    load();
  };

  const changeFollowUp = (value: 'all' | 'with') => {
    setFollowUp(value);
    applied.current.followUp = value;
    load();
  };

  const clearFilters = () => {
    setQuery('');
    setMinRating('');
    setCategory('');
    setDateFrom('');
    setDateTo('');
    setFollowUp('all');
    applied.current = { q: '', minRating: '', category: '', dateFrom: '', dateTo: '', followUp: 'all' };
    load();
  };

  // Drill-in: a canonical category becomes the category filter; anything else
  // (e.g. a requested activity) becomes a content search so it lands on real
  // matching responses instead of an empty filter.
  const KNOWN_CATEGORY_SET = new Set<string>(CATEGORIES);
  const handleDrillIn = (filter: { category?: string; rating?: number }) => {
    if (filter.category && KNOWN_CATEGORY_SET.has(filter.category)) {
      setCategory(filter.category);
      applied.current.category = filter.category;
    } else if (filter.category) {
      setQuery(filter.category);
      applied.current.q = filter.category;
    }
    if (filter.rating !== undefined) {
      const min = String(filter.rating);
      setMinRating(min);
      applied.current.minRating = min;
    }
    setSection('responses');
    load();
  };

  const handleExport = async () => {
    if (exporting || items.length === 0) return;
    setExporting(true);
    try {
      const res = await exportCsv(applied.current);
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
    // Confirmation happens in the card's two-step discard control.
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
            <nav aria-label="Dashboard sections" className="sticky top-0 z-30 border-b border-white/10 bg-midnight/80 backdrop-blur">
              <div className="mx-auto flex w-full max-w-5xl gap-2 px-4 sm:px-6">
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSection(s.id)}
                    aria-current={section === s.id ? 'page' : undefined}
                    className={`relative py-3 text-xs font-semibold uppercase tracking-[0.18em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-lavender/60 ${
                      section === s.id ? 'text-ink' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {s.label}
                    {section === s.id ? (
                      <motion.span
                        layoutId="section-indicator"
                        className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-lavender to-[#B8862F]"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    ) : null}
                  </button>
                ))}
              </div>
            </nav>
            <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={section}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  {section === 'overview' ? (
                    <div className="space-y-6">
                      <StatCards summary={summary} />
                      <Overview items={items} onDrillIn={handleDrillIn} />
                      {!loading && !listError && items.length === 0 ? (
                        <p className="rounded-2xl border border-white/10 bg-surface p-6 text-center text-sm text-muted">
                          No responses yet — share the feedback form and the picture will build itself here.
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {section === 'analytics' ? (
                    <div className="space-y-6">
                      {summary ? <Insights items={items} summary={summary} /> : null}
                      <Polls items={items} />
                      <TrendPanel items={items} />
                      <ComparePanel items={items} onDrillIn={handleDrillIn} />
                    </div>
                  ) : null}

                  {section === 'responses' ? (
                    <>
                      <FilterBar
                        query={query}
                        minRating={minRating}
                        category={category}
                        sort={sort}
                        onQueryChange={setQuery}
                        onMinRatingChange={changeMinRating}
                        onCategoryChange={changeCategory}
                        onSortChange={setSort}
                        onClear={clearFilters}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        followUp={followUp}
                        onDateFromChange={changeDateFrom}
                        onDateToChange={changeDateTo}
                        onFollowUpChange={changeFollowUp}
                      />
                      <div className="mb-6 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={handleExport}
                          disabled={exporting || items.length === 0}
                          className="inline-flex h-11 items-center rounded-xl bg-gradient-to-r from-yellow via-lavender to-[#B8862F] px-5 text-xs font-semibold uppercase tracking-[0.18em] text-midnight transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-lavender/60 focus:ring-offset-2 focus:ring-offset-midnight disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Export CSV · {items.length}
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
                        sort={sort}
                        onRetry={load}
                        onDiscard={handleDiscard}
                      />
                    </>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
