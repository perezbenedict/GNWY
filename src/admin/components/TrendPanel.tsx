import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { FeedbackItem } from '../types';
import { contactRate, dailySeries, momentum, timeOfDay } from '../lib/trends';

const BAR_SPRING = { type: 'spring', stiffness: 140, damping: 24 } as const;

function dayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function Bar({ percent }: { percent: number }) {
  return (
    <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/5">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={BAR_SPRING}
        className="h-full rounded-full bg-gradient-to-r from-lavender to-[#B8862F]"
      />
    </div>
  );
}

function Panel({ title, index, children }: { title: string; index: number; children: ReactNode }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26, delay: index * 0.06 }}
      className="min-w-0 rounded-2xl border border-white/10 bg-surface p-5 sm:p-6"
    >
      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{title}</h3>
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </motion.article>
  );
}

function Last14Days({ items }: { items: FeedbackItem[] }) {
  const series = dailySeries(items);
  const max = Math.max(0, ...series.map((day) => day.count));
  const total = series.reduce((sum, day) => sum + day.count, 0);
  const best = series.reduce((top, day) => (day.count > top.count ? day : top), series[0]);
  const responses = (count: number) => `${count} ${count === 1 ? 'response' : 'responses'}`;

  return (
    <>
      <div className="flex h-28 items-end gap-1">
        {series.map((day, i) => (
          <motion.div
            key={day.key}
            role="img"
            aria-label={`${dayLabel(day.date)}: ${responses(day.count)}`}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22, delay: i * 0.03 }}
            style={{
              height: day.count === 0 ? 4 : `${Math.max((day.count / max) * 100, 8)}%`,
            }}
            className={`min-w-0 flex-1 origin-bottom rounded-t ${
              i === series.length - 1
                ? 'bg-gradient-to-t from-lavender to-[#B8862F]'
                : 'bg-lavender/30'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted">
        {total === 0
          ? 'No responses in the last 14 days'
          : `Best day: ${dayLabel(best.date)} · ${responses(best.count)}`}
      </p>
    </>
  );
}

const TIME_SLOTS = [
  { name: 'Morning', label: 'Morning (before noon)' },
  { name: 'Afternoon', label: 'Afternoon (noon to 5 pm)' },
  { name: 'Evening', label: 'Evening (5 pm onward)' },
];

function TimeOfDay({ items }: { items: FeedbackItem[] }) {
  const buckets = timeOfDay(items);
  const counts = [buckets.morning, buckets.afternoon, buckets.evening];
  const total = counts.reduce((sum, count) => sum + count, 0);
  const rows = TIME_SLOTS.map((slot, i) => ({ ...slot, count: counts[i] })).sort(
    (a, b) => b.count - a.count
  );

  return (
    <>
      {rows.map((row) => {
        const percent = total > 0 ? Math.round((row.count / total) * 100) : 0;
        return (
          <div
            key={row.name}
            role="img"
            aria-label={`${row.name}: ${row.count} responses`}
            className="flex items-center gap-3"
          >
            <span className="min-w-0 max-w-[55%] truncate text-sm text-ink">{row.label}</span>
            <Bar percent={percent} />
            <span className="shrink-0 text-sm text-muted">
              {row.count} · {percent}%
            </span>
          </div>
        );
      })}
    </>
  );
}

function ReachRate({ items }: { items: FeedbackItem[] }) {
  const { withContact, total, pct } = contactRate(items);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  return (
    <>
      <div className="relative flex h-32 w-32 items-center justify-center self-center">
        <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="6" className="stroke-white/10" />
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className="stroke-lavender"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
            transition={BAR_SPRING}
          />
        </svg>
        <span className="font-display text-4xl font-semibold text-ink">{pct}%</span>
      </div>
      <p className="text-center text-sm text-muted">
        {withContact} of {total} shared contact details
      </p>
    </>
  );
}

function Momentum({ items }: { items: FeedbackItem[] }) {
  const { current7, previous7, deltaPct } = momentum(items);
  const tone =
    deltaPct === null || deltaPct === 0
      ? 'border-white/15 text-muted'
      : deltaPct > 0
        ? 'border-lavender/50 text-lavender'
        : 'border-crimson/50 text-crimson';

  return (
    <>
      <span
        className={`inline-flex items-center gap-2 self-start rounded-full border px-4 py-1.5 font-display text-xl font-semibold uppercase tracking-[0.1em] ${tone}`}
      >
        {deltaPct === null ? (
          '-'
        ) : deltaPct === 0 ? (
          'STEADY'
        ) : deltaPct > 0 ? (
          <>
            <ArrowUp aria-hidden="true" className="h-4 w-4" />
            UP {deltaPct}%
          </>
        ) : (
          <>
            <ArrowDown aria-hidden="true" className="h-4 w-4" />
            DOWN {Math.abs(deltaPct)}%
          </>
        )}
      </span>
      {deltaPct === null && <p className="text-xs text-muted">no baseline yet</p>}
      <p className="text-sm text-muted">
        {current7} this week vs {previous7} previous
      </p>
    </>
  );
}

export default function TrendPanel({ items }: { items: FeedbackItem[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-label="Trends" className="mb-6">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
        THE PULSE
      </h2>
      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <Panel title="LAST 14 DAYS" index={0}>
          <Last14Days items={items} />
        </Panel>
        <Panel title="TIME OF DAY" index={1}>
          <TimeOfDay items={items} />
        </Panel>
        <Panel title="REACH RATE" index={2}>
          <ReachRate items={items} />
        </Panel>
        <Panel title="MOMENTUM" index={3}>
          <Momentum items={items} />
        </Panel>
      </div>
    </section>
  );
}
