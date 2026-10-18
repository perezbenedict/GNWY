import { useEffect, useRef } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { Stars } from './StatCards';
import { SentimentBadge } from './ResponseCard';
import { classifyContact, getWhatsAppLink } from '../lib/whatsapp';
import type { FeedbackItem } from '../types';

function formatDateTime(value: string): string {
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

function Section({ label, value }: { label: string; value: string }) {
  const text = String(value ?? '').trim();
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      {text ? (
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">{text}</p>
      ) : (
        <p className="mt-1 text-sm text-muted/60">—</p>
      )}
    </div>
  );
}

export function ResponseDetail({ item, onClose }: { item: FeedbackItem; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  // Keep the latest onClose without re-running the mount effect (parent passes an
  // inline callback, so re-running would steal focus mid-dialog).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    cardRef.current?.focus();
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Simple Tab trap: wrap focus at the first/last focusable node in the card.
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const root = cardRef.current;
    if (!root) return;
    const focusables = Array.from(
      root.querySelectorAll<HTMLElement>('a[href], button, [tabindex]:not([tabindex="-1"])'),
    );
    if (focusables.length === 0) {
      event.preventDefault();
      root.focus();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (!active || !root.contains(active)) {
      event.preventDefault();
      first.focus();
      return;
    }
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const name = String(item.name ?? '').trim();
  const contact = String(item.contact ?? '').trim();
  const whoLabel = name || (contact ? 'No name given' : 'Anonymous');
  const contactHref = contact.includes('@')
    ? `mailto:${contact}`
    : /\d/.test(contact)
      ? `tel:${contact.replace(/[^\d+]/g, '')}`
      : null;
  const contactKind = contact ? classifyContact(item.contact) : 'empty';
  const waLink = contactKind === 'phone' ? getWhatsAppLink(contact) : null;
  const categories = String(item.categories || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label="Full response"
        tabIndex={-1}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onKeyDown={handleKeyDown}
        className="max-h-[85vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-surface p-6 focus:outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <SentimentBadge rating={item.rating} />
            <Stars value={item.rating} />
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-muted transition hover:border-white/25 hover:text-ink focus:outline-none focus:ring-2 focus:ring-lavender/40"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <time dateTime={item.created_at} className="mt-3 block text-sm text-muted">
          {formatDateTime(item.created_at)}
        </time>

        <p className="mt-4 text-lg font-medium text-ink">{whoLabel}</p>
        {contact ? (
          <div className="mt-1">
            {contactHref ? (
              <a
                href={contactHref}
                className="text-sm font-medium text-lavender underline underline-offset-4 hover:text-yellow focus:outline-none focus:ring-2 focus:ring-lavender/40"
              >
                {contact}
              </a>
            ) : (
              <span className="text-sm font-medium text-lavender">{contact}</span>
            )}
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              For follow-up only
            </p>
            {waLink ? (
              <div className="mt-3">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center rounded-xl border border-lavender/40 bg-lavender/10 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-lavender transition hover:bg-lavender/20 focus:outline-none focus:ring-2 focus:ring-lavender/40"
                >
                  WhatsApp {name || contact}
                </a>
                <p className="mt-1.5 text-[11px] text-muted">
                  Opens WhatsApp - you review and send the message yourself.
                </p>
              </div>
            ) : null}
            {contactKind === 'invalid' ? (
              <p className="mt-2 text-sm text-muted">Contact details not usable - reach out another way.</p>
            ) : null}
          </div>
        ) : null}

        {categories.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                key={category}
                className="rounded-full border border-lavender/25 bg-lavender/10 px-3 py-1 text-xs font-medium text-lavender"
              >
                {category}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-4">
          <Section label="What moved them" value={item.liked} />
          <Section label="What didn't land" value={item.disliked} />
          <Section label="Suggestions" value={item.suggestions} />
          <Section label="Expectations" value={item.expectations} />
        </div>
      </motion.div>
    </motion.div>
  );
}
