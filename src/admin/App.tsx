import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
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
  bulkDiscard,
  clearToken,
  discardFeedback,
  exportCsv,
  getToken,
  listFeedback,
  setToken,
  VaultError,
} from './api';
import type { DrillTarget } from './lib/overview';
import { CATEGORIES, type FeedbackItem, type SortMode, type Summary } from './types';

const AUTH_ERROR = 'Access key not recognized.';

interface AppliedFilters {
  q: string;
  minRating: string;
  maxRating: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  followUp: 'all' | 'with';
}

const emptyFilters = (): AppliedFilters => ({
  q: '',
  minRating: '',
  maxRating: '',
  category: '',
  dateFrom: '',
  dateTo: '',
  followUp: 'all',
});

const KNOWN_CATEGORIES = new Set<string>(CATEGORIES);

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

  // Two independent datasets so a Responses filter can never move Overview/Analytics.
  // allItems/summary: the complete feedback set — feeds StatCards, Overview, Insights,
  // Polls, TrendPanel and ComparePanel. respItems: the filtered Responses list only.
  const [allItems, setAllItems] = useState<FeedbackItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [allLoading, setAllLoading] = useState(false);
  const [allError, setAllError] = useState('');
  const [respItems, setRespItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(() => getToken() !== '');
  const [listError, setListError] = useState('');
  const [exporting, setExporting] = useState(false);

  const [query, setQuery] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<SortMode>('new');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [followUp, setFollowUp] = useState<'all' | 'with'>('all');
  const [section, setSection] = useState<SectionId>('overview');
  // Sections mount on first visit and stay mounted afterwards: count-ups and local
  // state (filters, dialogs, pagination) never restart when switching tabs.
  const [visited, setVisited] = useState<Record<SectionId, boolean>>({
    overview: true,
    analytics: false,
    responses: false,
  });
  const applied = useRef<AppliedFilters>(emptyFilters());

  // A 401 anywhere drops back to the gate and shows the auth message.
  const handleAuthFailure = useCallback((err: unknown): boolean => {
    if (err instanceof VaultError && err.message === AUTH_ERROR) {
      clearToken();
      setScreen('gate');
      setGateError(AUTH_ERROR);
      return true;
    }
    return false;
  }, []);

  const messageOf = (err: unknown, fallback: string): string =>
    err instanceof Error && err.message ? err.message : fallback;

  // Full dataset — fetched on mount, on Refresh, and after any discard.
  // Never refetched by filter changes.
  const loadAll = useCallback(async () => {
    setAllLoading(true);
    setAllError('');
    try {
      const data = await listFeedback(emptyFilters());
      setAllItems(Array.isArray(data.items) ? data.items : []);
      setSummary(data.summary ?? null);
    } catch (err) {
      if (!handleAuthFailure(err)) setAllError(messageOf(err, 'Could not load feedback data.'));
    } finally {
      setAllLoading(false);
    }
  }, [handleAuthFailure]);

  // Filtered Responses dataset — the only thing filter changes touch.
  const loadResponses = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      const data = await listFeedback(applied.current);
      setRespItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      if (!handleAuthFailure(err)) setListError(messageOf(err, 'Could not load responses.'));
    } finally {
      setLoading(false);
    }
  }, [handleAuthFailure]);

  // Load both datasets each time the dashboard becomes active.
  useEffect(() => {
    if (screen === 'dashboard') {
      loadAll();
      loadResponses();
    }
  }, [screen, loadAll, loadResponses]);

  // Debounced search; immediate reload when a select or Clear changes the applied filters.
  useEffect(() => {
    if (screen !== 'dashboard') return;
    const trimmed = query.trim();
    if (trimmed === applied.current.q) return;
    const timer = window.setTimeout(() => {
      applied.current.q = trimmed;
      loadResponses();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, screen, loadResponses]);

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
    loadResponses();
  };

  const changeMaxRating = (value: string) => {
    setMaxRating(value);
    applied.current.maxRating = value;
    loadResponses();
  };

  const changeCategory = (value: string) => {
    setCategory(value);
    applied.current.category = value;
    loadResponses();
  };

  const changeDateFrom = (value: string) => {
    setDateFrom(value);
    applied.current.dateFrom = value;
    loadResponses();
  };

  const changeDateTo = (value: string) => {
    setDateTo(value);
    applied.current.dateTo = value;
    loadResponses();
  };

  const changeFollowUp = (value: 'all' | 'with') => {
    setFollowUp(value);
    applied.current.followUp = value;
    loadResponses();
  };

  const clearFilters = () => {
    setQuery('');
    setMinRating('');
    setMaxRating('');
    setCategory('');
    setDateFrom('');
    setDateTo('');
    setFollowUp('all');
    applied.current = emptyFilters();
    loadResponses();
  };

  const refreshAll = () => {
    loadAll();
    loadResponses();
  };

  const goSection = (id: SectionId) => {
    setVisited((prev) => ({ ...prev, [id]: true }));
    setSection(id);
  };

  // Drill-in from Overview/ComparePanel metrics. Analytics targets only switch
  // section (that panel has its own filters). Responses targets reset the
  // response filters to exactly what the metric represents, so the destination
  // always shows the rows behind the number. The full dataset is untouched.
  const handleDrillIn = (target: DrillTarget) => {
    if (target.section !== 'responses') {
      goSection(target.section);
      return;
    }
    const next = emptyFilters();
    if (target.q) next.q = target.q;
    if (target.minRating !== undefined) next.minRating = String(target.minRating);
    if (target.maxRating !== undefined) next.maxRating = String(target.maxRating);
    if (target.followUp) next.followUp = target.followUp;
    if (target.category) {
      // Canonical categories filter directly; anything else (e.g. a requested
      // activity from the compare panel) becomes a content search so it lands
      // on real matching responses instead of an empty category filter.
      if (KNOWN_CATEGORIES.has(target.category)) next.category = target.category;
      else next.q = target.category;
    }
    applied.current = next;
    setQuery(next.q);
    setMinRating(next.minRating);
    setMaxRating(next.maxRating);
    setCategory(next.category);
    setDateFrom(next.dateFrom);
    setDateTo(next.dateTo);
    setFollowUp(next.followUp);
    goSection('responses');
    loadResponses();
  };

  const handleExport = async () => {
    if (exporting || respItems.length === 0) return;
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
      if (!handleAuthFailure(err)) setListError(messageOf(err, 'Export failed.'));
    } finally {
      setExporting(false);
    }
  };

  // Discards require a freshly re-entered access key (reauth), validated by the
  // server. Errors bubble to the dialog for display; only a genuine session
  // failure returns to the gate. Both datasets refresh because the records changed.
  const handleDiscard = async (id: string, reauth: string) => {
    try {
      await discardFeedback(id, reauth);
    } catch (err) {
      if (handleAuthFailure(err)) return;
      throw err;
    }
    await Promise.all([loadAll(), loadResponses()]);
  };

  const handleBulkDiscard = async (
    ids: string[],
    reauth: string
  ): Promise<{ discarded: string[]; failed: { id: string; error: string }[] }> => {
    let result: { discarded: string[]; failed: { id: string; error: string }[] };
    try {
      result = await bulkDiscard(ids, reauth);
    } catch (err) {
      if (handleAuthFailure(err)) return { discarded: [], failed: [] };
      throw err;
    }
    if (result.discarded.length > 0) await Promise.all([loadAll(), loadResponses()]);
    return result;
  };

  const sectionMotion = (id: SectionId) => ({
    initial: { opacity: 0 },
    animate: { opacity: section === id ? 1 : 0 },
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    hidden: section !== id,
  });

  return (
    <div className="min-h-[100dvh]">
      <Atmosphere />
      <motion.div
        key={screen === 'gate' ? 'gate' : 'dashboard'}
        initial={{ opacity: 0, scale: screen === 'gate' ? 0.97 : 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="min-h-[100dvh]"
      >
        {screen === 'gate' ? (
          <Gate error={gateError} onSubmit={handleUnlock} />
        ) : (
          <>
            {/* One sticky header block: topbar + section nav can never overlap. */}
            <div className="sticky top-0 z-30">
              <Topbar onLock={handleLock} />
              <nav
                aria-label="Dashboard sections"
                className="border-b border-white/10 bg-midnight/80 backdrop-blur"
              >
                <div className="mx-auto flex w-full max-w-5xl gap-4 px-4 sm:gap-8 sm:px-6">
                  {SECTIONS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => goSection(s.id)}
                      aria-current={section === s.id ? 'page' : undefined}
                      className={`relative rounded-lg py-3.5 text-xs font-semibold uppercase tracking-[0.18em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-lavender/60 sm:px-2 ${
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
            </div>
            <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6">
              {visited.overview ? (
                <motion.section aria-label="Overview" className="space-y-6" {...sectionMotion('overview')}>
                  <StatCards summary={summary} />
                  <Overview items={allItems} onDrillIn={handleDrillIn} />
                  {allError ? (
                    <p role="alert" className="rounded-2xl border border-crimson/30 bg-surface p-4 text-sm text-muted">
                      {allError}{' '}
                      <button
                        type="button"
                        onClick={() => loadAll()}
                        className="font-semibold uppercase tracking-[0.16em] text-lavender underline-offset-2 hover:underline"
                      >
                        Try again
                      </button>
                    </p>
                  ) : null}
                  {!allLoading && !allError && allItems.length === 0 ? (
                    <p className="rounded-2xl border border-white/10 bg-surface p-6 text-center text-sm text-muted">
                      No responses yet — share the feedback form and the picture will build itself here.
                    </p>
                  ) : null}
                </motion.section>
              ) : null}

              {visited.analytics ? (
                <motion.section aria-label="Analytics" className="space-y-6" {...sectionMotion('analytics')}>
                  {summary ? <Insights items={allItems} summary={summary} /> : null}
                  <Polls items={allItems} />
                  <TrendPanel items={allItems} />
                  <ComparePanel
                    items={allItems}
                    onDrillIn={(filter) => handleDrillIn({ section: 'responses', category: filter.category })}
                  />
                </motion.section>
              ) : null}

              {visited.responses ? (
                <motion.section aria-label="Responses" {...sectionMotion('responses')}>
                  <FilterBar
                    query={query}
                    minRating={minRating}
                    maxRating={maxRating}
                    category={category}
                    sort={sort}
                    onQueryChange={setQuery}
                    onMinRatingChange={changeMinRating}
                    onMaxRatingChange={changeMaxRating}
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
                      disabled={exporting || respItems.length === 0}
                      className="inline-flex h-11 items-center rounded-xl bg-gradient-to-r from-yellow via-lavender to-[#B8862F] px-5 text-xs font-semibold uppercase tracking-[0.18em] text-midnight transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-lavender/60 focus:ring-offset-2 focus:ring-offset-midnight disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Export CSV · {respItems.length}
                    </button>
                    <button
                      type="button"
                      onClick={refreshAll}
                      className="inline-flex h-11 items-center rounded-xl border border-white/10 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted transition hover:border-lavender/40 hover:text-ink focus:outline-none focus:ring-2 focus:ring-lavender/40"
                    >
                      Refresh
                    </button>
                  </div>
                  <FeedbackList
                    loading={loading}
                    error={listError}
                    items={respItems}
                    sort={sort}
                    onRetry={loadResponses}
                    onDiscard={handleDiscard}
                    onBulkDiscard={handleBulkDiscard}
                  />
                </motion.section>
              ) : null}
            </main>
          </>
        )}
      </motion.div>
    </div>
  );
}
