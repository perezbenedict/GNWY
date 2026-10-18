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

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Cubic-bezier solver so the rAF count-up follows motion's ease array exactly.
function cubicBezierEase([p1x, p1y, p2x, p2y]: [number, number, number, number]) {
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x;
      if (Math.abs(err) < 1e-5) break;
      const d = sampleDX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    return sampleY(t);
  };
}

const easeExpoOut = cubicBezierEase(EXPO_OUT);

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
    const duration = 1400;
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeExpoOut(t);
      setDisplay(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [value]);

  if (display === null) return <span className="text-3xl font-semibold text-muted">—</span>;
  return <span className="text-3xl font-semibold tabular-nums text-ink">{display}</span>;
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EXPO_OUT, delay: index * 0.08 }}
          className="rounded-2xl border border-lavender/10 bg-surface p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{card.label}</p>
          <div className="mt-3">{card.content}</div>
        </motion.article>
      ))}
    </section>
  );
}
