import { useId } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { CATEGORIES } from '../types';
import type { FeedbackItem } from '../types';
import { countKnownLabels, topN } from '../lib/insights';
import { dailySeries, timeOfDay } from '../lib/trends';
import {
  barGeometry,
  formatDayLabel,
  ratingDistribution,
  sentimentSplit,
  seriesToPath,
} from '../lib/charts';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const VIEWPORT = { once: true, margin: '-40px' } as const;

const GOLD = '#E8C77A';
const DEEP_GOLD = '#B8862F';
const CRIMSON = '#B3223A';

function Card({ title, index, children }: { title: string; index: number; children: ReactNode }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.5, ease: EASE, delay: Math.min(index * 0.06, 0.3) }}
      className="rounded-2xl border border-white/10 bg-surface p-5 sm:p-6"
    >
      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{title}</h3>
      <div className="mt-4">{children}</div>
    </motion.article>
  );
}

const TIME_W = 560;
const TIME_H = 200;
const TIME_PAD = 28;

function ResponsesOverTime({ items }: { items: FeedbackItem[] }) {
  const uid = useId().replace(/:/g, '');
  const series = dailySeries(items, 14);
  const points = series.map((day) => ({ label: formatDayLabel(day.key), value: day.count }));
  const { line, area, max } = seriesToPath(points, TIME_W, TIME_H, TIME_PAD);
  const total = series.reduce((sum, day) => sum + day.count, 0);

  if (max === 0) return <p className="text-sm text-muted">No responses in the last 14 days</p>;

  const peak = series.find((day) => day.count === max);
  const peakLabel = peak ? formatDayLabel(peak.key) : '';
  // Mirrors the x/y mapping inside seriesToPath so labels and dots sit on the line.
  const baseline = TIME_H - TIME_PAD;
  const xFor = (index: number): number =>
    TIME_PAD + (index / (series.length - 1)) * (TIME_W - TIME_PAD * 2);
  const yFor = (count: number): number => baseline - (count / max) * (TIME_H - TIME_PAD * 2);

  return (
    <svg
      viewBox={`0 0 ${TIME_W} ${TIME_H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`Responses per day, last 14 days: ${total} total, peak ${max} per day on ${peakLabel}`}
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={GOLD} stopOpacity="0.35" />
          <stop offset="1" stopColor={DEEP_GOLD} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}-line`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={GOLD} />
          <stop offset="1" stopColor={DEEP_GOLD} />
        </linearGradient>
      </defs>
      <text x={6} y={16} fontSize={12} className="fill-muted tabular-nums">
        {`Peak: ${max} / day`}
      </text>
      <line
        x1={TIME_PAD}
        y1={baseline}
        x2={TIME_W - TIME_PAD}
        y2={baseline}
        className="stroke-white/10"
      />
      <motion.path
        d={area}
        fill={`url(#${uid}-area)`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={VIEWPORT}
        transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke={`url(#${uid}-line)`}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={VIEWPORT}
        transition={{ duration: 1.1, ease: EASE }}
      />
      {series.map((day, index) => (
        <g key={day.key}>
          <circle cx={xFor(index)} cy={yFor(day.count)} r={3.5} className="fill-lavender">
            <title>{`${formatDayLabel(day.key)}: ${day.count} ${
              day.count === 1 ? 'response' : 'responses'
            }`}</title>
          </circle>
          {index % 2 === 0 && (
            <text
              x={xFor(index)}
              y={baseline + 16}
              fontSize={12}
              textAnchor="middle"
              className="fill-muted"
            >
              {formatDayLabel(day.key)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

const RATING_W = 560;
const RATING_H = 240;
const RATING_PAD = 32;

function RatingDistribution({ items }: { items: FeedbackItem[] }) {
  const uid = useId().replace(/:/g, '');
  const buckets = ratingDistribution(items);
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  if (total === 0) return <p className="text-sm text-muted">No ratings yet</p>;

  const baseline = RATING_H - RATING_PAD;
  const geometry = barGeometry(
    buckets.map((bucket) => bucket.count),
    RATING_W,
    RATING_H,
    RATING_PAD
  );
  // Gold = positive (4-5), muted lavender = neutral (3), crimson = attention (1-2).
  const fillFor = (rating: number): { fill: string; fillOpacity: number } =>
    rating >= 4
      ? { fill: `url(#${uid}-gold)`, fillOpacity: 1 }
      : rating === 3
        ? { fill: GOLD, fillOpacity: 0.4 }
        : { fill: CRIMSON, fillOpacity: 0.9 };

  return (
    <svg
      viewBox={`0 0 ${RATING_W} ${RATING_H}`}
      role="img"
      aria-label={`Rating distribution: ${buckets
        .map((bucket) => `${bucket.count} at ${bucket.rating} stars`)
        .join(', ')}`}
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={GOLD} />
          <stop offset="1" stopColor={DEEP_GOLD} />
        </linearGradient>
      </defs>
      <line
        x1={RATING_PAD}
        y1={baseline}
        x2={RATING_W - RATING_PAD}
        y2={baseline}
        className="stroke-white/10"
      />
      {geometry.map((bar, index) => (
        <g key={bar.index}>
          <motion.rect
            x={bar.x}
            width={bar.w}
            rx={3}
            initial={{ height: 0, attrY: baseline }}
            whileInView={{ height: bar.h, attrY: bar.y }}
            viewport={VIEWPORT}
            transition={{ duration: 0.55, ease: EASE, delay: 0.1 + index * 0.05 }}
            {...fillFor(buckets[bar.index].rating)}
          >
            <title>{`${buckets[bar.index].rating} stars: ${bar.count} responses`}</title>
          </motion.rect>
          <text
            x={bar.x + bar.w / 2}
            y={bar.y - 8}
            fontSize={13}
            textAnchor="middle"
            className="fill-ink tabular-nums"
          >
            {bar.count}
          </text>
          <text
            x={bar.x + bar.w / 2}
            y={baseline + 18}
            fontSize={12}
            textAnchor="middle"
            className="fill-muted"
          >
            {`${buckets[bar.index].rating} ★`}
          </text>
        </g>
      ))}
    </svg>
  );
}

const SENT_W = 560;
const SENT_BAR_H = 26;

function SentimentSplit({ items }: { items: FeedbackItem[] }) {
  const split = sentimentSplit(items);
  const rated = split.positive + split.neutral + split.attention;

  if (rated === 0) {
    return (
      <>
        <p className="text-sm text-muted">No ratings yet</p>
        {split.unrated > 0 && (
          <p className="mt-2 text-xs text-muted">{`${split.unrated} unrated`}</p>
        )}
      </>
    );
  }

  const segments = [
    { label: 'Positive', stars: '4-5 ★', count: split.positive, fill: GOLD, opacity: 1 },
    { label: 'Neutral', stars: '3 ★', count: split.neutral, fill: GOLD, opacity: 0.45 },
    { label: 'Attention', stars: '1-2 ★', count: split.attention, fill: CRIMSON, opacity: 1 },
  ];
  let offset = 0;
  const placed = segments.map((segment) => {
    const w = (segment.count / rated) * SENT_W;
    const rect = { ...segment, x: offset, w };
    offset += w;
    return rect;
  });

  return (
    <>
      <svg
        viewBox={`0 0 ${SENT_W} ${SENT_BAR_H + 12}`}
        role="img"
        aria-label={`Sentiment split of ${rated} rated responses: ${split.positive} positive, ${split.neutral} neutral, ${split.attention} attention${
          split.unrated > 0 ? `, ${split.unrated} unrated` : ''
        }`}
        className="h-auto w-full"
      >
        {placed.map((segment, index) => (
          <motion.rect
            key={segment.label}
            x={segment.x}
            y={6}
            height={SENT_BAR_H}
            fill={segment.fill}
            fillOpacity={segment.opacity}
            initial={{ width: 0 }}
            whileInView={{ width: segment.w }}
            viewport={VIEWPORT}
            transition={{ duration: 0.45, ease: EASE, delay: 0.1 + index * 0.16 }}
          >
            <title>{`${segment.label} (${segment.stars}): ${segment.count}`}</title>
          </motion.rect>
        ))}
      </svg>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {placed.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: segment.fill, opacity: segment.opacity }}
            />
            <span className="text-ink">{segment.label}</span>
            <span className="tabular-nums text-muted">
              {segment.count} · {Math.round((segment.count / rated) * 100)}%
            </span>
          </li>
        ))}
      </ul>
      {split.unrated > 0 && (
        <p className="mt-2 text-xs text-muted">{`${split.unrated} unrated`}</p>
      )}
    </>
  );
}

const CAT_W = 560;
const CAT_ROW = 38;
const CAT_LABEL_W = 170;
const CAT_COUNT_W = 40;

function topCategories(items: FeedbackItem[], limit: number) {
  const tally = new Map<string, number>();
  for (const item of items) {
    for (const entry of countKnownLabels(item.categories, CATEGORIES).counts) {
      tally.set(entry.label, (tally.get(entry.label) ?? 0) + entry.count);
    }
  }
  const sorted = [...tally]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  return topN(sorted, limit);
}

function TopCategories({ items }: { items: FeedbackItem[] }) {
  const uid = useId().replace(/:/g, '');
  const rows = topCategories(items, 5);
  if (rows.length === 0) return <p className="text-sm text-muted">No categories yet</p>;

  const max = rows[0].count;
  const barMax = CAT_W - CAT_LABEL_W - CAT_COUNT_W - 12;
  const height = rows.length * CAT_ROW;

  return (
    <svg
      viewBox={`0 0 ${CAT_W} ${height}`}
      role="img"
      aria-label={`Top categories: ${rows.map((row) => `${row.label} ${row.count}`).join(', ')}`}
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id={`${uid}-cat`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={GOLD} />
          <stop offset="1" stopColor={DEEP_GOLD} />
        </linearGradient>
      </defs>
      {rows.map((row, index) => {
        const y = index * CAT_ROW;
        return (
          <g key={row.label}>
            <title>{`${row.label}: ${row.count}`}</title>
            <text x={0} y={y + CAT_ROW / 2 + 4} fontSize={13} className="fill-ink">
              {row.label}
            </text>
            <motion.rect
              x={CAT_LABEL_W}
              y={y + CAT_ROW / 2 - 8}
              height={16}
              rx={3}
              fill={`url(#${uid}-cat)`}
              initial={{ width: 0 }}
              whileInView={{ width: max > 0 ? (row.count / max) * barMax : 0 }}
              viewport={VIEWPORT}
              transition={{ duration: 0.55, ease: EASE, delay: 0.1 + index * 0.06 }}
            />
            <text
              x={CAT_W}
              y={y + CAT_ROW / 2 + 4}
              fontSize={13}
              textAnchor="end"
              className="fill-muted tabular-nums"
            >
              {row.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const TOD_W = 560;
const TOD_H = 200;
const TOD_PAD = 28;

function TimeOfDay({ items }: { items: FeedbackItem[] }) {
  const uid = useId().replace(/:/g, '');
  const buckets = timeOfDay(items);
  const rows = [
    { label: 'Morning', hint: 'before noon', count: buckets.morning },
    { label: 'Afternoon', hint: 'noon to 5 pm', count: buckets.afternoon },
    { label: 'Evening', hint: '5 pm onward', count: buckets.evening },
  ];
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) return <p className="text-sm text-muted">No responses to bucket yet</p>;

  const baseline = TOD_H - TOD_PAD;
  const geometry = barGeometry(
    rows.map((row) => row.count),
    TOD_W,
    TOD_H,
    TOD_PAD
  );

  return (
    <svg
      viewBox={`0 0 ${TOD_W} ${TOD_H}`}
      role="img"
      aria-label={`Time of day: ${rows
        .map((row) => `${row.count} ${row.label.toLowerCase()}`)
        .join(', ')}`}
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id={`${uid}-tod`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={GOLD} />
          <stop offset="1" stopColor={DEEP_GOLD} />
        </linearGradient>
      </defs>
      <line x1={TOD_PAD} y1={baseline} x2={TOD_W - TOD_PAD} y2={baseline} className="stroke-white/10" />
      {geometry.map((bar, index) => (
        <g key={rows[bar.index].label}>
          <motion.rect
            x={bar.x}
            width={bar.w}
            rx={3}
            fill={`url(#${uid}-tod)`}
            initial={{ height: 0, attrY: baseline }}
            whileInView={{ height: bar.h, attrY: bar.y }}
            viewport={VIEWPORT}
            transition={{ duration: 0.55, ease: EASE, delay: 0.1 + index * 0.07 }}
          >
            <title>{`${rows[bar.index].label} (${rows[bar.index].hint}): ${bar.count} responses`}</title>
          </motion.rect>
          <text
            x={bar.x + bar.w / 2}
            y={bar.y - 8}
            fontSize={13}
            textAnchor="middle"
            className="fill-ink tabular-nums"
          >
            {bar.count}
          </text>
          <text
            x={bar.x + bar.w / 2}
            y={baseline + 18}
            fontSize={12}
            textAnchor="middle"
            className="fill-muted"
          >
            {rows[bar.index].label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function Charts({ items }: { items: FeedbackItem[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-label="Charts" className="mb-6">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
        CHARTS AT A GLANCE
      </h2>
      <div className="space-y-6">
        <Card title="Responses over time" index={0}>
          <ResponsesOverTime items={items} />
        </Card>
        <Card title="Rating distribution" index={1}>
          <RatingDistribution items={items} />
        </Card>
        <Card title="Sentiment split" index={2}>
          <SentimentSplit items={items} />
        </Card>
        <Card title="Top categories" index={3}>
          <TopCategories items={items} />
        </Card>
        <Card title="Time of day" index={4}>
          <TimeOfDay items={items} />
        </Card>
      </div>
    </section>
  );
}
