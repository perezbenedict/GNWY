import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import type { Summary } from '../types';

export function Stars({ value }: { value: number | null }) {
  if (value === null || !Number.isFinite(Number(value))) {
    return <span className="text-sm text-muted">No rating</span>;
  }
  const rounded = Math.max(0, Math.min(5, Math.round(Number(value))));
  return (
    <span role="img" aria-label={`Rated ${rounded} out of 5`} className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={`h-4 w-4 ${i <= rounded ? 'fill-lavender text-lavender' : 'fill-white/10 text-muted/40'}`}
        />
      ))}
    </span>
  );
}

function CountUp({ value }: { value: number | null }) {
  const [display, setDisplay] = useState<number | null>(value === null ? null : 0);

  useEffect(() => {
    if (value === null) {
      setDisplay(null);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }
    const duration = 600;
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [value]);

  if (display === null) return <span className="text-3xl font-semibold text-muted">—</span>;
  return <span className="text-3xl font-semibold text-ink">{display}</span>;
}

function topCategory(summary: Summary | null): { name: string; count: number } | null {
  const counts = summary?.categoryCounts ?? {};
  let top: { name: string; count: number } | null = null;
  for (const [name, raw] of Object.entries(counts)) {
    const count = Number(raw);
    if (!Number.isFinite(count)) continue;
    if (!top || count > top.count) top = { name, count };
  }
  return top && top.name ? top : null;
}

export function StatCards({ summary }: { summary: Summary | null }) {
  const avg = summary?.averageRating ?? null;
  const hasAvg = avg !== null && Number.isFinite(avg);
  const top = topCategory(summary);

  const cards: Array<{ label: string; content: ReactNode }> = [
    { label: 'Total responses', content: <CountUp value={summary ? summary.total : null} /> },
    {
      label: 'Average rating',
      content: hasAvg ? (
        <div className="flex items-center gap-3">
          <Stars value={avg} />
          <span className="text-3xl font-semibold text-ink">{avg.toFixed(1)}</span>
        </div>
      ) : (
        <span className="text-3xl font-semibold text-muted">—</span>
      ),
    },
    { label: 'Responses today', content: <CountUp value={summary ? summary.todayCount : null} /> },
    {
      label: 'Top category',
      content: top ? (
        <>
          <p className="text-xl font-semibold text-ink sm:text-2xl">{top.name}</p>
          <p className="mt-1 text-sm text-muted">{top.count} mentions</p>
        </>
      ) : (
        <span className="text-3xl font-semibold text-muted">—</span>
      ),
    },
  ];

  return (
    <section aria-label="Response summary" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <motion.article
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26, delay: index * 0.06 }}
          className="rounded-2xl border border-lavender/10 bg-surface p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{card.label}</p>
          <div className="mt-3">{card.content}</div>
        </motion.article>
      ))}
    </section>
  );
}
