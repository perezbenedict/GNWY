import { motion } from 'motion/react';
import { MessageSquare, Star, Trash2 } from 'lucide-react';
import { Stars } from './StatCards';
import { classifyContact, getWhatsAppLink } from '../lib/whatsapp';
import type { FeedbackItem } from '../types';

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

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

function formatShortTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '';
  return `${date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}, ${date.toLocaleTimeString(
    undefined,
    { hour: '2-digit', minute: '2-digit' },
  )}`;
}

// Compact rating for the stack row: same role/aria-label pattern as Stars, smaller glyphs.
function CompactStars({ value }: { value: number | null }) {
  if (value === null || !Number.isFinite(value)) {
    return (
      <span className="shrink-0 text-xs text-muted/60" aria-hidden="true">
        —
      </span>
    );
  }
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span role="img" aria-label={`Rated ${rounded} out of 5`} className="inline-flex shrink-0 items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={`h-3 w-3 ${i <= rounded ? 'fill-lavender text-lavender' : 'fill-white/10 text-muted/40'}`}
        />
      ))}
    </span>
  );
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

// Sentiment derived from rating: 4-5 positive, 3 neutral, 1-2 needs attention.
// A null rating is unrated and renders no badge.
function sentimentFor(rating: number | null): { label: string; className: string } | null {
  if (rating === null || !Number.isFinite(rating)) return null;
  if (rating >= 4) return { label: 'Positive', className: 'border-lavender/50 bg-lavender/15 text-lavender' };
  if (rating === 3) return { label: 'Neutral', className: 'border-lavender/20 bg-lavender/5 text-lavender/70' };
  return { label: 'Needs attention', className: 'border-crimson/40 bg-crimson/10 text-crimson' };
}

export function SentimentBadge({ rating }: { rating: number | null }) {
  const sentiment = sentimentFor(rating);
  if (!sentiment) return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${sentiment.className}`}
    >
      {sentiment.label}
    </span>
  );
}

export function ResponseCard({
  item,
  index,
  onDiscardRequest,
  onOpen,
  selected,
  onToggleSelect,
  variant = 'full',
}: {
  item: FeedbackItem;
  index: number;
  onDiscardRequest?: (item: FeedbackItem) => void;
  onOpen: () => void;
  selected?: boolean;
  onToggleSelect?: (id: string, selected: boolean) => void;
  variant?: 'full' | 'stack';
}) {
  const categories = String(item.categories || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const name = String(item.name ?? '').trim();
  const contact = String(item.contact ?? '').trim();
  const who = [item.name, item.contact]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(' · ');
  const hasContact = Boolean(contact);
  const contactKind = classifyContact(item.contact);
  const waLink = contactKind === 'phone' ? getWhatsAppLink(contact) : null;

  if (variant === 'stack') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: EXPO_OUT, delay: Math.min(index * 0.04, 0.32) }}
        exit={{
          opacity: 0,
          height: 0,
          overflow: 'hidden',
          transition: { duration: 0.22, ease: 'easeInOut' },
        }}
        role="button"
        tabIndex={0}
        aria-label={`Open full response from ${name || 'anonymous respondent'}`}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpen();
          }
        }}
        className="flex h-12 w-full cursor-pointer items-center gap-2 overflow-hidden px-3 text-left transition hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-lavender/40"
      >
        {onToggleSelect ? (
          <label
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={Boolean(selected)}
              onChange={(event) => onToggleSelect(item.id, event.target.checked)}
              aria-label={`Select response from ${name || 'anonymous respondent'}`}
              className="h-4 w-4 accent-lavender"
            />
          </label>
        ) : null}
        <time dateTime={item.created_at} className="shrink-0 whitespace-nowrap text-xs text-muted">
          {formatShortTimestamp(item.created_at)}
        </time>
        <CompactStars value={item.rating} />
        <span className="min-w-0 truncate text-sm text-ink">{name || 'Anonymous'}</span>
        {categories.length ? (
          <span className="hidden max-w-[9rem] shrink-0 truncate rounded-full border border-lavender/25 bg-lavender/10 px-2 py-0.5 text-[11px] font-medium text-lavender sm:inline-flex">
            {categories[0]}
          </span>
        ) : null}
        <SentimentBadge rating={item.rating} />
        {hasContact ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-muted">
            <MessageSquare className="h-3 w-3" aria-hidden="true" />
            Follow-up
          </span>
        ) : null}
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open WhatsApp chat with ${name || 'respondent'}`}
            onClick={(event) => event.stopPropagation()}
            className="inline-flex shrink-0 items-center rounded-full border border-lavender/40 bg-lavender/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-lavender transition hover:bg-lavender/20 focus:outline-none focus:ring-2 focus:ring-lavender/40"
          >
            WhatsApp
          </a>
        ) : null}
        {contactKind === 'email' ? (
          <a
            href={`mailto:${contact}`}
            aria-label={`Email ${name || 'respondent'}`}
            onClick={(event) => event.stopPropagation()}
            className="inline-flex shrink-0 items-center rounded-full border border-lavender/40 bg-lavender/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-lavender transition hover:bg-lavender/20 focus:outline-none focus:ring-2 focus:ring-lavender/40"
          >
            Email
          </a>
        ) : null}
        <span className="flex-1" aria-hidden="true" />
        {onDiscardRequest ? (
          <button
            type="button"
            aria-label={`Discard response from ${name || 'anonymous respondent'}`}
            onClick={(event) => {
              event.stopPropagation();
              onDiscardRequest(item);
            }}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted transition hover:text-crimson focus:outline-none focus:ring-2 focus:ring-crimson/40"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: EXPO_OUT, delay: Math.min(index * 0.04, 0.32) }}
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
          {onToggleSelect ? (
            <label className="-ml-2 inline-flex h-11 w-11 cursor-pointer items-center justify-center">
              <input
                type="checkbox"
                checked={Boolean(selected)}
                onChange={(event) => onToggleSelect(item.id, event.target.checked)}
                aria-label={`Select response from ${name || 'anonymous respondent'}`}
                className="h-4 w-4 accent-lavender"
              />
            </label>
          ) : null}
          <time dateTime={item.created_at} className="text-sm text-muted">
            {formatTimestamp(item.created_at)}
          </time>
          <Stars value={item.rating} />
          <SentimentBadge rating={item.rating} />
          {hasContact ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-muted">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              Follow-up
            </span>
          ) : null}
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open WhatsApp chat with ${name || 'respondent'}`}
              className="inline-flex h-11 items-center rounded-full border border-lavender/40 bg-lavender/10 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-lavender transition hover:bg-lavender/20 focus:outline-none focus:ring-2 focus:ring-lavender/40"
            >
              WhatsApp
            </a>
          ) : null}
          {contactKind === 'email' ? (
            <a
              href={`mailto:${contact}`}
              aria-label={`Email ${name || 'respondent'}`}
              className="inline-flex h-11 items-center rounded-full border border-lavender/40 bg-lavender/10 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-lavender transition hover:bg-lavender/20 focus:outline-none focus:ring-2 focus:ring-lavender/40"
            >
              Email
            </a>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onDiscardRequest?.(item)}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-crimson/30 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted transition hover:border-crimson/60 hover:text-crimson focus:outline-none focus:ring-2 focus:ring-crimson/40"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Discard
        </button>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Open full response"
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpen();
          }
        }}
        className="mt-4 cursor-pointer rounded-xl focus:outline-none focus:ring-2 focus:ring-lavender/40"
      >
        {categories.length ? (
          <div className="flex flex-wrap gap-2">
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
      </div>
    </motion.article>
  );
}
