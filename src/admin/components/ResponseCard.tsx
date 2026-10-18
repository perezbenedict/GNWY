import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { Stars } from './StatCards';
import type { FeedbackItem } from '../types';

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '';
  return date.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TextBlock({ label, value }: { label: string; value: string }) {
  const text = String(value ?? '').trim();
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      {text ? (
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">{text}</p>
      ) : (
        <p className="mt-1 text-sm text-muted/60" aria-hidden="true">
          —
        </p>
      )}
    </div>
  );
}

export function ResponseCard({
  item,
  index,
  onDiscard,
}: {
  item: FeedbackItem;
  index: number;
  onDiscard: (id: string) => void;
}) {
  const categories = String(item.categories || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const who = [item.name, item.contact]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(' · ');

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 260, damping: 26, delay: Math.min(index * 0.05, 0.4) },
      }}
      exit={{
        opacity: 0,
        height: 0,
        marginTop: 0,
        marginBottom: 0,
        overflow: 'hidden',
        transition: { duration: 0.22, ease: 'easeInOut' },
      }}
      className="rounded-2xl border border-lavender/10 bg-surface p-5 transition hover:-translate-y-0.5 hover:border-lavender/40 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <time dateTime={item.created_at} className="text-sm text-muted">
            {formatTimestamp(item.created_at)}
          </time>
          <Stars value={item.rating} />
        </div>
        <button
          type="button"
          onClick={() => onDiscard(item.id)}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-crimson/30 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted transition hover:border-crimson/60 hover:text-crimson focus:outline-none focus:ring-2 focus:ring-crimson/40"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Discard
        </button>
      </div>

      {categories.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((name) => (
            <span
              key={name}
              className="rounded-full border border-lavender/25 bg-lavender/10 px-3 py-1 text-xs font-medium text-lavender"
            >
              {name}
            </span>
          ))}
        </div>
      ) : null}

      {who ? <p className="mt-3 text-sm text-muted">{who}</p> : null}

      <div className="mt-5 flex flex-col gap-4">
        <TextBlock label="What moved them" value={item.liked} />
        <TextBlock label="What didn't land" value={item.disliked} />
        <TextBlock label="Suggestions" value={item.suggestions} />
        <TextBlock label="Expectations" value={item.expectations} />
      </div>
    </motion.article>
  );
}
