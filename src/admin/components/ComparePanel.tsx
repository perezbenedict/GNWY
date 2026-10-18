import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { compareDays, serviceDayKeys, type DayComparison } from '../lib/compare';
import type { FeedbackItem } from '../types';

const SELECT_CLASS =
  'h-12 w-full rounded-xl border border-white/10 bg-surface px-4 text-sm text-ink outline-none transition focus:border-lavender/50 focus:ring-2 focus:ring-lavender/40';
const LABEL_CLASS = 'mb-2 block text-sm font-medium text-ink';

function formatDay(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

type Row =
  | {
      kind: 'number';
      label: string;
      a: string;
      b: string;
      delta: number | null;
      decimals: number;
      unit: string;
    }
  | { kind: 'text'; label: string; a: string | null; b: string | null };

function buildRows(comparison: DayComparison): Row[] {
  const avgDelta =
    comparison.avgA !== null && comparison.avgB !== null
      ? Math.round((comparison.avgB - comparison.avgA) * 10) / 10
      : null;
  const pctDelta =
    comparison.avgA !== null && comparison.avgB !== null
      ? comparison.positiveB - comparison.positiveA
      : null;
  const fmtAvg = (avg: number | null) => (avg === null ? '—' : avg.toFixed(1));
  const fmtPct = (avg: number | null, pct: number) => (avg === null ? '—' : `${pct}%`);
  return [
    {
      kind: 'number',
      label: 'Responses',
      a: String(comparison.countA),
      b: String(comparison.countB),
      delta: comparison.countB - comparison.countA,
      decimals: 0,
      unit: '',
    },
    {
      kind: 'number',
      label: 'Avg score',
      a: fmtAvg(comparison.avgA),
      b: fmtAvg(comparison.avgB),
      delta: avgDelta,
      decimals: 1,
      unit: '',
    },
    {
      kind: 'number',
      label: 'Positive %',
      a: fmtPct(comparison.avgA, comparison.positiveA),
      b: fmtPct(comparison.avgB, comparison.positiveB),
      delta: pctDelta,
      decimals: 0,
      unit: ' pts',
    },
    { kind: 'text', label: 'Top category', a: comparison.topCategoryA, b: comparison.topCategoryB },
    { kind: 'text', label: 'Top request', a: comparison.topActivityA, b: comparison.topActivityB },
  ];
}

function DeltaChip({
  delta,
  decimals,
  unit,
}: {
  delta: number | null;
  decimals: number;
  unit: string;
}) {
  const tone =
    delta === null || delta === 0
      ? 'border-white/15 text-muted'
      : delta > 0
        ? 'border-lavender/50 text-lavender'
        : 'border-crimson/50 text-crimson';
  const arrow = delta === null || delta === 0 ? '•' : delta > 0 ? '▲' : '▼';
  const value = delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(decimals)}${unit}`;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium tabular-nums ${tone}`}
    >
      <span aria-hidden="true">{arrow}</span>
      {value}
    </span>
  );
}

function TextCell({
  label,
  onDrillIn,
}: {
  label: string | null;
  onDrillIn?: (filter: { category?: string }) => void;
}) {
  if (label === null) return <span className="min-w-0 truncate text-sm text-muted">—</span>;
  if (!onDrillIn) return <span className="min-w-0 truncate text-sm text-ink">{label}</span>;
  return (
    <button
      type="button"
      onClick={() => onDrillIn({ category: label })}
      title={label}
      className="min-w-0 max-w-full truncate rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-sm text-ink transition hover:border-lavender/40 hover:text-yellow focus:outline-none focus:ring-2 focus:ring-lavender/40"
    >
      {label}
    </button>
  );
}

export default function ComparePanel({
  items,
  onDrillIn,
}: {
  items: FeedbackItem[];
  onDrillIn?: (filter: { category?: string }) => void;
}) {
  const keys = serviceDayKeys(items);
  // null = untouched, so the defaults below track the latest days as items change.
  const [fromSel, setFromSel] = useState<string | null>(null);
  const [toSel, setToSel] = useState<string | null>(null);

  // Fewer than two distinct service days leaves nothing honest to compare.
  if (items.length === 0 || keys.length < 2) return null;

  const from = fromSel !== null && keys.includes(fromSel) ? fromSel : keys[keys.length - 2];
  const to = toSel !== null && keys.includes(toSel) ? toSel : keys[keys.length - 1];
  const rows = buildRows(compareDays(items, from, to));

  return (
    <section aria-label="Service comparison" className="mb-6">
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.18 }}
        className="min-w-0 rounded-2xl border border-white/10 bg-surface p-5 sm:p-6"
      >
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          SERVICE vs SERVICE
        </h2>

        <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor="compare-from" className={LABEL_CLASS}>
              From
            </label>
            <select
              id="compare-from"
              value={from}
              onChange={(event) => setFromSel(event.target.value)}
              className={SELECT_CLASS}
            >
              {keys.map((key) => (
                <option key={key} value={key}>
                  {formatDay(key)}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor="compare-to" className={LABEL_CLASS}>
              To
            </label>
            <select
              id="compare-to"
              value={to}
              onChange={(event) => setToSel(event.target.value)}
              className={SELECT_CLASS}
            >
              {keys.map((key) => (
                <option key={key} value={key}>
                  {formatDay(key)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${from}|${to}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="mt-5 flex flex-col gap-3"
          >
            <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-3">
              <span className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-lavender sm:col-start-2">
                {formatDay(from)}
              </span>
              <span className="truncate text-right text-xs font-semibold uppercase tracking-[0.18em] text-lavender sm:col-start-3">
                {formatDay(to)}
              </span>
            </div>
            {rows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-2 items-center gap-x-4 gap-y-1.5 sm:grid-cols-3"
              >
                <div className="col-span-2 flex items-center justify-center gap-2 text-center sm:col-span-1 sm:justify-start sm:text-left">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    {row.label}
                  </span>
                  {row.kind === 'number' && (
                    <DeltaChip delta={row.delta} decimals={row.decimals} unit={row.unit} />
                  )}
                </div>
                <div className="flex min-w-0 items-center justify-start">
                  {row.kind === 'number' ? (
                    <span className="truncate text-sm tabular-nums text-ink">{row.a}</span>
                  ) : (
                    <TextCell label={row.a} onDrillIn={onDrillIn} />
                  )}
                </div>
                <div className="flex min-w-0 items-center justify-end">
                  {row.kind === 'number' ? (
                    <span className="truncate text-sm tabular-nums text-ink">{row.b}</span>
                  ) : (
                    <TextCell label={row.b} onDrillIn={onDrillIn} />
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.article>
    </section>
  );
}
