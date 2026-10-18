import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LayoutGrid, List, Rows3, X } from 'lucide-react';
import { Emblem } from '../../components/Emblem';
import { ResponseCard } from './ResponseCard';
import { ResponseDetail } from './ResponseDetail';
import DiscardDialog from './DiscardDialog';
import type { FeedbackItem, SortMode } from '../types';

const PAGE_SIZE = 25;

const VIEW_STORAGE_KEY = 'gnwy_admin_view';

const VIEW_MODES = [
  { id: 'list', label: 'List view', Icon: List },
  { id: 'grid', label: 'Grid view', Icon: LayoutGrid },
  { id: 'stack', label: 'Stack view', Icon: Rows3 },
] as const;

type ViewMode = (typeof VIEW_MODES)[number]['id'];

function readStoredView(): ViewMode {
  try {
    const stored = localStorage.getItem(VIEW_STORAGE_KEY);
    return stored === 'grid' || stored === 'stack' ? stored : 'list';
  } catch {
    return 'list'; // storage unavailable (private mode, blocked cookies)
  }
}

const SHIMMER_BAR =
  'animate-[shimmer_2.5s_linear_infinite] rounded-full bg-white/5';
const SHIMMER_STYLE = {
  backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
  backgroundSize: '200% 100%',
} as const;

function SkeletonCard() {
  return (
    <div aria-hidden="true" className="rounded-2xl border border-lavender/10 bg-surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <span className={`h-4 w-44 ${SHIMMER_BAR}`} style={SHIMMER_STYLE} />
        <span className={`h-4 w-24 ${SHIMMER_BAR}`} style={SHIMMER_STYLE} />
      </div>
      <div className="mt-4 flex gap-2">
        <span className={`h-6 w-20 ${SHIMMER_BAR}`} style={SHIMMER_STYLE} />
        <span className={`h-6 w-28 ${SHIMMER_BAR}`} style={SHIMMER_STYLE} />
      </div>
      <div className="mt-5 flex flex-col gap-4">
        <span className={`h-4 w-full ${SHIMMER_BAR}`} style={SHIMMER_STYLE} />
        <span className={`h-4 w-11/12 ${SHIMMER_BAR}`} style={SHIMMER_STYLE} />
        <span className={`h-4 w-2/3 ${SHIMMER_BAR}`} style={SHIMMER_STYLE} />
      </div>
    </div>
  );
}

// Pure sort used by App. Date sorts keep the newest-first server order ('new') or reverse it
// ('old'); rating sorts send unrated items last in both directions. Array.sort is stable.
export function sortItems(items: FeedbackItem[], sort: SortMode): FeedbackItem[] {
  const list = [...items];
  if (sort === 'high' || sort === 'low') {
    const direction = sort === 'high' ? -1 : 1;
    return list.sort((a, b) => {
      const ra = a.rating;
      const rb = b.rating;
      if (ra === null && rb === null) return 0;
      if (ra === null) return 1;
      if (rb === null) return -1;
      return (ra - rb) * direction;
    });
  }
  const direction = sort === 'old' ? 1 : -1;
  return list.sort(
    (a, b) => direction * ((Date.parse(a.created_at) || 0) - (Date.parse(b.created_at) || 0)),
  );
}

interface DayGroup {
  key: string;
  date: Date | null;
  startIndex: number;
  items: FeedbackItem[];
}

// Group consecutive items sharing a LOCAL calendar date. Items with unparseable dates
// collapse into their own 'Undated' groups wherever they fall in the order.
function groupByDay(items: FeedbackItem[]): DayGroup[] {
  const groups: DayGroup[] = [];
  items.forEach((item, index) => {
    const date = new Date(item.created_at);
    const valid = !Number.isNaN(date.getTime());
    const key = valid ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` : `undated-${index}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(item);
    } else {
      groups.push({ key, date: valid ? date : null, startIndex: index, items: [item] });
    }
  });
  return groups;
}

function dayLabel(date: Date | null): string {
  if (!date) return 'Undated';
  const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

// Identifying line for the single-discard dialog: name/nickname · date · rating.
function dialogLabel(item: FeedbackItem): string {
  const name = String(item.name ?? '').trim() || 'Anonymous';
  const date = new Date(item.created_at);
  const when = Number.isNaN(date.getTime())
    ? item.created_at || 'Undated'
    : date.toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
  const rating = item.rating === null ? 'Unrated' : `${item.rating}★`;
  return `${name} · ${when} · ${rating}`;
}

export function FeedbackList({
  loading,
  error,
  items,
  sort,
  onRetry,
  onDiscard,
  onBulkDiscard,
}: {
  loading: boolean;
  error: string;
  items: FeedbackItem[];
  sort: SortMode;
  onRetry: () => void;
  onDiscard: (id: string, reauth: string) => Promise<void>;
  onBulkDiscard: (
    ids: string[],
    reauth: string,
  ) => Promise<{ discarded: string[]; failed: { id: string; error: string }[] }>;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [discardTarget, setDiscardTarget] = useState<FeedbackItem | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>(readStoredView);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const changeView = (next: ViewMode) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // storage unavailable; keep the in-session selection
    }
  };

  // Re-cap the list when filtering shrinks it below what is currently shown.
  useEffect(() => {
    setVisibleCount((count) => (items.length < count ? PAGE_SIZE : count));
  }, [items.length]);

  // Drop selections whose responses are no longer present (refetch, discard).
  useEffect(() => {
    setSelectedIds((prev) => {
      const present = new Set(items.map((item) => item.id));
      const next = new Set<string>();
      let changed = false;
      prev.forEach((id) => {
        if (present.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [items]);

  // Result banner auto-dismisses after ~6s.
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const selected = (selectedId && items.find((item) => item.id === selectedId)) || null;
  const sorted = sortItems(items, sort);
  const grouped = sort === 'new' || sort === 'old';
  const visible = sorted.slice(0, visibleCount);
  const remaining = sorted.length - visibleCount;
  const selectedCount = selectedIds.size;
  const allVisibleSelected = visible.length > 0 && visible.every((item) => selectedIds.has(item.id));
  const someVisibleSelected = visible.some((item) => selectedIds.has(item.id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
    }
  }, [someVisibleSelected, allVisibleSelected]);

  const toggleSelect = (id: string, isSelected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isSelected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAllVisible = (isSelected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      visible.forEach((item) => {
        if (isSelected) next.add(item.id);
        else next.delete(item.id);
      });
      return next;
    });
  };

  return (
    <section aria-live="polite" aria-busy={loading}>
      {error ? (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-crimson/40 bg-crimson/10 px-4 py-3 text-sm text-ink"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-11 items-center rounded-lg border border-white/15 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted transition hover:border-lavender/40 hover:text-ink focus:outline-none focus:ring-2 focus:ring-lavender/40"
          >
            Retry
          </button>
        </div>
      ) : null}

      {notice ? (
        <div
          role="status"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-lavender/25 bg-lavender/10 px-4 py-3 text-sm text-ink"
        >
          <span>{notice}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setNotice(null)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted transition hover:text-ink focus:outline-none focus:ring-2 focus:ring-lavender/40"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {items.length > 0 || !loading ? (
        <div className="mb-4 flex items-center justify-end rounded-xl border border-lavender/10 bg-surface px-4 py-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted/70">View</span>
            <div
              role="group"
              aria-label="Response view mode"
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 p-1"
            >
              {VIEW_MODES.map(({ id, label, Icon }) => {
                const active = view === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    aria-label={label}
                    onClick={() => changeView(id)}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-md transition focus:outline-none focus:ring-2 focus:ring-lavender/40 ${
                      active
                        ? 'border border-lavender/50 bg-lavender/15 text-ink'
                        : 'border border-transparent text-muted hover:text-ink'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {!loading && !error && visible.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-lavender/10 bg-surface px-4 py-2">
          <label className="inline-flex h-11 cursor-pointer items-center gap-3 text-sm text-muted">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={allVisibleSelected}
              onChange={(event) => toggleAllVisible(event.target.checked)}
              className="h-4 w-4 accent-lavender"
            />
            Select all {visible.length} shown
          </label>
          <p className="text-xs text-muted/70">Applies to the responses currently shown.</p>
        </div>
      ) : null}

      {!loading && selectedCount > 0 ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-lavender/25 bg-lavender/10 px-4 py-2">
          <span aria-live="polite" className="text-sm font-medium text-ink">
            {selectedCount} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="inline-flex h-11 items-center rounded-lg border border-white/15 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted transition hover:border-lavender/40 hover:text-ink focus:outline-none focus:ring-2 focus:ring-lavender/40"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setBulkOpen(true)}
              className="inline-flex h-11 items-center rounded-xl border border-crimson/60 bg-crimson/10 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-crimson transition hover:bg-crimson/20 focus:outline-none focus:ring-2 focus:ring-crimson/40"
            >
              Discard {selectedCount}
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="flex flex-col gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : sorted.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 rounded-2xl border border-lavender/10 bg-surface px-6 py-14 text-center"
        >
          <motion.div
            aria-hidden="true"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Emblem className="h-12 w-12 opacity-90" />
          </motion.div>
          <p className="text-sm text-muted">No responses yet - share the QR poster after service to begin.</p>
        </motion.div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {visible.map((item, index) => (
              <ResponseCard
                key={item.id}
                item={item}
                index={index}
                selected={selectedIds.has(item.id)}
                onToggleSelect={toggleSelect}
                onDiscardRequest={setDiscardTarget}
                onOpen={() => setSelectedId(item.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : view === 'stack' ? (
        <div className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-lavender/10 bg-surface">
          <AnimatePresence initial={false}>
            {visible.map((item, index) => (
              <ResponseCard
                key={item.id}
                item={item}
                index={index}
                variant="stack"
                selected={selectedIds.has(item.id)}
                onToggleSelect={toggleSelect}
                onDiscardRequest={setDiscardTarget}
                onOpen={() => setSelectedId(item.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : grouped ? (
        <div className="space-y-6">
          {groupByDay(visible).map((group) => (
            <div key={group.key} className="space-y-4">
              <motion.h3
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                className="pt-2 text-sm uppercase tracking-wide text-muted"
              >
                {dayLabel(group.date)}{' '}
                <span className="normal-case">
                  · {group.items.length} {group.items.length === 1 ? 'response' : 'responses'}
                </span>
              </motion.h3>
              <AnimatePresence initial={false}>
                {group.items.map((item, offset) => (
                  <ResponseCard
                    key={item.id}
                    item={item}
                    index={group.startIndex + offset}
                    selected={selectedIds.has(item.id)}
                    onToggleSelect={toggleSelect}
                    onDiscardRequest={setDiscardTarget}
                    onOpen={() => setSelectedId(item.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {visible.map((item, index) => (
              <ResponseCard
                key={item.id}
                item={item}
                index={index}
                selected={selectedIds.has(item.id)}
                onToggleSelect={toggleSelect}
                onDiscardRequest={setDiscardTarget}
                onOpen={() => setSelectedId(item.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {!loading && !error && remaining > 0 ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount(sorted.length)}
            className="inline-flex h-11 items-center rounded-lg border border-white/15 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted transition hover:border-lavender/40 hover:text-ink focus:outline-none focus:ring-2 focus:ring-lavender/40"
          >
            Show {remaining} more
          </button>
        </div>
      ) : null}

      <AnimatePresence>
        {selected ? <ResponseDetail item={selected} onClose={() => setSelectedId(null)} /> : null}
      </AnimatePresence>

      <AnimatePresence>
        {discardTarget ? (
          <DiscardDialog
            mode="single"
            count={1}
            label={dialogLabel(discardTarget)}
            onCancel={() => setDiscardTarget(null)}
            onConfirm={async (reauth) => {
              try {
                await onDiscard(discardTarget.id, reauth);
                setDiscardTarget(null);
                setNotice('Discarded 1 response.');
                return null;
              } catch (err) {
                return err instanceof Error ? err.message : 'Discard failed. Nothing was removed.';
              }
            }}
          />
        ) : null}
        {bulkOpen && selectedCount > 0 ? (
          <DiscardDialog
            mode="bulk"
            count={selectedCount}
            onCancel={() => setBulkOpen(false)}
            onConfirm={async (reauth) => {
              const ids = Array.from(selectedIds);
              try {
                const result = await onBulkDiscard(ids, reauth);
                setBulkOpen(false);
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  result.discarded.forEach((id) => next.delete(id));
                  return next;
                });
                const discarded = result.discarded.length;
                const failed = result.failed.length;
                setNotice(
                  failed === 0
                    ? `Discarded ${discarded} response${discarded === 1 ? '' : 's'}.`
                    : `Discarded ${discarded} of ${ids.length}. ${failed} could not be discarded - they may have already been removed.`,
                );
                return null;
              } catch (err) {
                return err instanceof Error ? err.message : 'Discard failed. Nothing was removed.';
              }
            }}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}
