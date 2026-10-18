import { AnimatePresence, motion } from 'motion/react';
import { Emblem } from '../../components/Emblem';
import { ResponseCard } from './ResponseCard';
import type { FeedbackItem } from '../types';

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

export function FeedbackList({
  loading,
  error,
  items,
  onRetry,
  onDiscard,
}: {
  loading: boolean;
  error: string;
  items: FeedbackItem[];
  onRetry: () => void;
  onDiscard: (id: string) => void;
}) {
  const sorted = [...items].sort(
    (a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0),
  );

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
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {sorted.map((item, index) => (
              <ResponseCard key={item.id} item={item} index={index} onDiscard={onDiscard} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
