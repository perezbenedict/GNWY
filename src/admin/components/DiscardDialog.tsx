import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { motion } from 'motion/react';
import { Loader2, Trash2, X } from 'lucide-react';

export default function DiscardDialog({
  mode,
  count,
  label,
  onCancel,
  onConfirm,
}: {
  mode: 'single' | 'bulk';
  count: number;
  label?: string;
  onCancel: () => void;
  onConfirm: (reauth: string) => Promise<string | null>;
}) {
  // The access key lives only in this local state: cleared on success and on
  // close, never persisted or lifted to the parent.
  const [reauth, setReauth] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  // Keep the latest onCancel without re-running the mount effect (parent passes an
  // inline callback, so re-running would steal focus mid-dialog).
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  const handleCancel = () => {
    setReauth('');
    setError(null);
    onCancelRef.current();
  };

  useEffect(() => {
    cardRef.current?.focus();
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') handleCancel();
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
      root.querySelectorAll<HTMLElement>('a[href], button, input, [tabindex]:not([tabindex="-1"])'),
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reauth.trim() || pending) return;
    setPending(true);
    setError(null);
    try {
      const failure = await onConfirm(reauth);
      if (failure) {
        setError(failure);
        return;
      }
      // Success: parent closes the dialog; clearing here keeps the key out of
      // any lingering state.
      setReauth('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setPending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) handleCancel();
      }}
    >
      <motion.div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="discard-dialog-title"
        tabIndex={-1}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onKeyDown={handleKeyDown}
        className="max-h-[85vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-surface p-6 focus:outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="discard-dialog-title" className="text-lg font-medium text-ink">
            {mode === 'single' ? 'Discard this response?' : `Discard ${count} responses?`}
          </h2>
          <button
            type="button"
            aria-label="Cancel"
            onClick={handleCancel}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-muted transition hover:border-white/25 hover:text-ink focus:outline-none focus:ring-2 focus:ring-lavender/40"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {mode === 'single' && label ? (
          <p className="mt-2 text-sm text-muted">{label}</p>
        ) : null}
        {mode === 'bulk' ? (
          <p className="mt-2 text-sm text-muted">
            These are permanently deleted from the vault. This cannot be recovered.
          </p>
        ) : null}

        <p className="mt-4 text-sm text-ink">This permanently deletes the data. It cannot be recovered.</p>

        <form onSubmit={handleSubmit} className="mt-5">
          <label htmlFor="discard-reauth" className="block text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Confirm your access key
          </label>
          <input
            id="discard-reauth"
            type="password"
            autoComplete="current-password"
            value={reauth}
            onChange={(event) => setReauth(event.target.value)}
            disabled={pending}
            className="mt-2 h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-lavender/40"
          />
          <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-crimson">
            {error ?? ''}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex h-11 items-center rounded-xl border border-white/15 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted transition hover:border-lavender/40 hover:text-ink focus:outline-none focus:ring-2 focus:ring-lavender/40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reauth.trim() || pending}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-crimson/60 bg-crimson/10 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-crimson transition hover:bg-crimson/20 focus:outline-none focus:ring-2 focus:ring-crimson/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Discarding…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Discard
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
