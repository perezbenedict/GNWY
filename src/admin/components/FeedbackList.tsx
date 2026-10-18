import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Emblem } from '../../components/Emblem';
import { ResponseCard } from './ResponseCard';
import { ResponseDetail } from './ResponseDetail';
import type { FeedbackItem, SortMode } from '../types';

const PAGE_SIZE = 25;

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

export function FeedbackList({
  loading,
  error,
  items,
  sort,
  onRetry,
  onDiscard,
}: {
  loading: boolean;
  error: string;
  items: FeedbackItem[];
  sort: SortMode;
  onRetry: () => void;
  onDiscard: (id: string) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Re-cap the list when filtering shrinks it below what is currently shown.
  useEffect(() => {
    setVisibleCount((count) => (items.length < count ? PAGE_SIZE : count));
  }, [items.length]);

  const selected = (selectedId && items.find((item) => item.id === selectedId)) || null;
  const sorted = sortItems(items, sort);
  const grouped = sort === 'new' || sort === 'old';
  const visible = sorted.slice(0, visibleCount);
  const remaining = sorted.length - visibleCount;

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
                    onDiscard={onDiscard}
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
                onDiscard={onDiscard}
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
    </section>
  );
}
