import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import type { FeedbackItem, Summary } from '../types';

const BAR_SPRING = { type: 'spring', stiffness: 140, damping: 24 } as const;

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
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="min-w-0 rounded-2xl border border-white/10 bg-surface p-5 sm:p-6"
    >
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{title}</h2>
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </motion.article>
  );
}

function RatingDistribution({ items }: { items: FeedbackItem[] }) {
  const buckets = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: items.filter((item) => item.rating === rating).length,
  }));
  const largest = Math.max(0, ...buckets.map((bucket) => bucket.count));

  return (
    <Panel title="Rating distribution">
      {largest === 0 ? (
        <p className="text-sm text-muted">No ratings yet</p>
      ) : (
        buckets.map((bucket) => (
          <div
            key={bucket.rating}
            role="img"
            aria-label={`Rating ${bucket.rating}: ${bucket.count} responses`}
            title={`${bucket.rating} stars: ${bucket.count} responses`}
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <span className="shrink-0 text-sm text-muted">{bucket.rating} ★</span>
            <Bar percent={(bucket.count / largest) * 100} />
            <span className="w-8 shrink-0 text-right text-sm text-ink">{bucket.count}</span>
          </div>
        ))
      )}
    </Panel>
  );
}

function TopCategories({ summary }: { summary: Summary }) {
  const top = Object.entries(summary.categoryCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const largest = top.length ? top[0][1] : 0;

  return (
    <Panel title="Top categories">
      {top.length === 0 ? (
        <p className="text-sm text-muted">No categories yet</p>
      ) : (
        top.map(([name, count]) => {
          const percent = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
          return (
            <div
              key={name}
              title={name}
              className="flex items-center gap-3 transition-opacity hover:opacity-80"
            >
              <span className="min-w-0 max-w-[45%] truncate text-sm text-ink" title={name}>
                {name}
              </span>
              <Bar percent={largest > 0 ? (count / largest) * 100 : 0} />
              <span className="shrink-0 text-sm text-muted">
                {count} · {percent}%
              </span>
            </div>
          );
        })
      )}
    </Panel>
  );
}

export function Insights({ items, summary }: { items: FeedbackItem[]; summary: Summary }) {
  if (summary.total <= 0) return null;
  return (
    <section aria-label="Insights" className="mb-6 grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
      <RatingDistribution items={items} />
      <TopCategories summary={summary} />
    </section>
  );
}
