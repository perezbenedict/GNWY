import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { IMPROVE_OPTIONS } from '../../screens/ImproveScreen';
import { NEXT_OPTIONS } from '../../screens/NextScreen';
import { STOOD_OUT_OPTIONS } from '../../screens/StoodOutScreen';
import { countKnownLabels, topN } from '../lib/insights';
import type { FeedbackItem } from '../types';

const BAR_SPRING = { type: 'spring', stiffness: 140, damping: 24 } as const;
const TOP_N = 5;

interface Entry {
  label: string;
  count: number;
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

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.18 }}
      className="min-w-0 rounded-2xl border border-white/10 bg-surface p-5 sm:p-6"
    >
      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{title}</h3>
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </motion.article>
  );
}

function sortEntries(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function tallyFields(fields: string[], known: readonly string[]): Entry[] {
  const tally = new Map<string, number>();
  for (const field of fields) {
    for (const entry of countKnownLabels(field, known).counts) {
      tally.set(entry.label, (tally.get(entry.label) ?? 0) + entry.count);
    }
  }
  return sortEntries([...tally].map(([label, count]) => ({ label, count })));
}

// No canonical labels exist for expectations (buildPayload keeps it free text),
// so answers poll as whole strings, deduped case-insensitively.
function tallyExpectations(fields: string[]): Entry[] {
  const tally = new Map<string, Entry>();
  for (const field of fields) {
    const answer = field.trim();
    if (!answer) continue;
    const key = answer.toLowerCase();
    const hit = tally.get(key);
    if (hit) hit.count += 1;
    else tally.set(key, { label: answer, count: 1 });
  }
  return sortEntries([...tally.values()]);
}

function PollPanel({ title, entries, total }: { title: string; entries: Entry[]; total: number }) {
  const top = topN(entries, TOP_N);
  const maxCount = top.length > 0 ? top[0].count : 0;

  return (
    <Panel title={title}>
      {top.length === 0 ? (
        <p className="text-sm text-muted">No mentions yet</p>
      ) : (
        top.map((entry, index) => {
          const rank = index + 1;
          const percent = Math.round((entry.count / total) * 100);
          return (
            <div
              key={entry.label}
              role="img"
              aria-label={`${entry.label}: ${entry.count} mentions`}
              className="flex items-center gap-3"
            >
              <span
                className={`w-4 shrink-0 text-right text-sm ${
                  rank <= 3 ? 'font-semibold text-yellow' : 'text-lavender'
                }`}
              >
                {rank}
              </span>
              <span className="min-w-0 max-w-[40%] line-clamp-1 text-sm text-ink" title={entry.label}>
                {entry.label}
              </span>
              <Bar percent={maxCount > 0 ? (entry.count / maxCount) * 100 : 0} />
              <span className="shrink-0 text-sm text-muted">
                {entry.count} mentions · {percent}%
              </span>
            </div>
          );
        })
      )}
    </Panel>
  );
}

export default function Polls({ items }: { items: FeedbackItem[] }) {
  if (items.length === 0) return null;

  const total = items.length;
  const liked = tallyFields(
    items.map((item) => item.liked),
    STOOD_OUT_OPTIONS,
  );
  const disliked = tallyFields(
    items.map((item) => item.disliked),
    IMPROVE_OPTIONS,
  );
  const suggested = tallyFields(
    items.map((item) => item.suggestions),
    NEXT_OPTIONS,
  );
  const expected = tallyExpectations(items.map((item) => item.expectations));

  return (
    <section aria-label="Response polls" className="mb-6">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        THE CROWD HAS SPOKEN
      </h2>
      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <PollPanel title="WHAT MOVED THEM MOST" entries={liked} total={total} />
        <PollPanel title="WHAT DIDN'T LAND" entries={disliked} total={total} />
        <PollPanel title="WHAT WE KEEP HEARING" entries={suggested} total={total} />
        <PollPanel title="WHAT THEY'RE EXPECTING" entries={expected} total={total} />
      </div>
    </section>
  );
}
