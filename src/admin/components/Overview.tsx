import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { ArrowDown, ArrowRight, ArrowUp, MessageSquare } from 'lucide-react';
import type { FeedbackItem } from '../types';
import { computeOverview } from '../lib/overview';
import { Stars } from './StatCards';

function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const reduced = useReducedMotion() === true;
  const motionValue = useMotionValue(reduced ? value : 0);
  const text = useTransform(motionValue, (latest) => latest.toFixed(decimals));

  useEffect(() => {
    if (reduced) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, { duration: 0.9, ease: 'easeOut' });
    return () => controls.stop();
  }, [motionValue, value, reduced]);

  // tabular-nums keeps digit widths fixed so counting never reflows the card.
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

type CardEntry = {
  label: string;
  content: ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
};

function StatCard({ entry, index }: { entry: CardEntry; index: number }) {
  const reduced = useReducedMotion() === true;
  const body = (
    <>
      {/* The card's single gradient accent: a hairline top edge, not a full-card wash. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-lavender to-[#B8862F]"
      />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{entry.label}</p>
      <div className="mt-3 min-w-0">{entry.content}</div>
    </>
  );
  const shared =
    'relative min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-surface p-5';

  if (entry.onClick) {
    return (
      <motion.button
        type="button"
        onClick={entry.onClick}
        aria-label={entry.ariaLabel}
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26, delay: index * 0.05 }}
        className={`${shared} w-full cursor-pointer text-left transition hover:border-lavender/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-lavender/60`}
      >
        {body}
      </motion.button>
    );
  }
  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26, delay: index * 0.05 }}
      className={shared}
    >
      {body}
    </motion.article>
  );
}

function formatDay(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  if (!year || !month || !day) return key;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : String(delta);
}

export default function Overview({
  items,
  onDrillIn,
}: {
  items: FeedbackItem[];
  onDrillIn?: (filter: { category?: string; rating?: number }) => void;
}) {
  const reduced = useReducedMotion() === true;
  if (items.length === 0) return null;

  const stats = computeOverview(items);
  const topCategory = stats.topCategory;
  const topActivity = stats.topActivity;

  const cards: CardEntry[] = [
    {
      label: 'Total responses',
      content: (
        <p className="text-3xl font-semibold text-ink">
          <CountUp value={stats.total} />
        </p>
      ),
    },
    {
      label: 'Experience score',
      content:
        stats.avgRating === null ? (
          <span className="text-3xl font-semibold text-muted">—</span>
        ) : (
          <div className="min-w-0">
            <p className="flex flex-wrap items-baseline gap-x-2 text-3xl font-semibold text-ink">
              <CountUp value={stats.avgRating} decimals={1} />
              <span className="text-xs font-medium text-muted">out of 5</span>
            </p>
            <Stars value={stats.avgRating} />
          </div>
        ),
    },
    {
      label: 'Positive',
      content: (
        <>
          <p className="flex flex-wrap items-baseline gap-x-2 text-3xl font-semibold text-ink">
            <CountUp value={stats.positive} />
            <span className="text-sm font-semibold text-lavender">{stats.positivePct}%</span>
          </p>
          <p className="mt-1 text-xs text-muted">Neutral {stats.neutral}</p>
        </>
      ),
    },
    {
      label: 'Needs attention',
      content: (
        <p className="flex flex-wrap items-baseline gap-x-2 text-3xl font-semibold text-ink">
          <CountUp value={stats.negative} />
          <span className="text-sm font-semibold text-crimson">{stats.negativePct}%</span>
        </p>
      ),
    },
    {
      label: 'Top category',
      content: topCategory ? (
        <>
          <p className="break-words text-base font-semibold text-ink sm:text-lg">
            {topCategory.label}
          </p>
          <p className="mt-1 text-xs text-muted">{topCategory.count} mentions</p>
        </>
      ) : (
        <span className="text-sm text-muted">No categories yet</span>
      ),
      onClick:
        onDrillIn && topCategory ? () => onDrillIn({ category: topCategory.label }) : undefined,
      ariaLabel: topCategory ? `View responses in ${topCategory.label}` : undefined,
    },
    {
      label: 'Top request',
      // Suggestions carry no category/rating filter, so this card is never drillable.
      content: topActivity ? (
        <>
          <p className="break-words text-base font-semibold text-ink sm:text-lg">
            {topActivity.label}
          </p>
          <p className="mt-1 text-xs text-muted">{topActivity.count} mentions</p>
        </>
      ) : (
        <span className="text-sm text-muted">No requests yet</span>
      ),
    },
    {
      label: 'Written comments',
      content: (
        <p className="text-3xl font-semibold text-ink">
          <CountUp value={stats.withComments} />
        </p>
      ),
    },
    {
      label: 'Follow-up opt-ins',
      content: (
        <div className="flex min-w-0 flex-wrap items-center gap-x-2">
          <MessageSquare aria-hidden="true" className="h-4 w-4 shrink-0 text-lavender" />
          <span className="text-3xl font-semibold text-ink">
            <CountUp value={stats.followUps} />
          </span>
          <span className="text-sm text-muted">{stats.followUpPct}%</span>
        </div>
      ),
    },
  ];

  const comparison = stats.dayComparison;
  const deltaTone =
    comparison === null || comparison.countDelta === 0
      ? 'text-muted'
      : comparison.countDelta > 0
        ? 'text-lavender'
        : 'text-crimson';
  const DeltaArrow =
    comparison === null || comparison.countDelta === 0
      ? ArrowRight
      : comparison.countDelta > 0
        ? ArrowUp
        : ArrowDown;

  return (
    <section aria-label="Executive overview" className="mb-6">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        At a glance
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {cards.map((card, index) => (
          <StatCard key={card.label} entry={card} index={index} />
        ))}
      </div>
      {comparison ? (
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26, delay: cards.length * 0.05 }}
          className="mt-4 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-white/10 bg-surface p-4"
        >
          <DeltaArrow aria-hidden="true" className={`h-4 w-4 shrink-0 ${deltaTone}`} />
          <p className="min-w-0 text-sm text-ink">
            vs {formatDay(comparison.previousDay)}: {formatDelta(comparison.countDelta)} responses
          </p>
          <p className="min-w-0 text-xs text-muted">
            comparing the two most recent service days ({formatDay(comparison.currentDay)} vs{' '}
            {formatDay(comparison.previousDay)})
          </p>
        </motion.div>
      ) : null}
    </section>
  );
}
