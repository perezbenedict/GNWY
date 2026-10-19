import { Loader2, Rocket } from 'lucide-react';
import { motion } from 'motion/react';
import { ghostButtonClass, primaryButtonClass } from '../components/NavButtons';
import { ScreenShell } from '../components/ScreenShell';
import { buildPayload } from '../api/submit';
import { RATING_OPTIONS } from './RatingScreen';
import type { Answers } from '../types';

interface ReviewRow {
  label: string;
  value: string;
  step: number;
}

const clip = (s: string) => (s.length > 160 ? s.slice(0, 157) + '…' : s);

function buildRows(answers: Answers): ReviewRow[] {
  const payload = buildPayload(answers);
  const rows: ReviewRow[] = [];
  if (payload.rating !== null) {
    const option = RATING_OPTIONS.find((o) => o.value === payload.rating);
    rows.push({ label: 'Rating', value: option ? option.label : `${payload.rating} of 5`, step: 1 });
  }
  if (payload.liked.trim()) rows.push({ label: 'What stood out', value: clip(payload.liked.trim()), step: 2 });
  if (payload.disliked.trim()) rows.push({ label: 'Could be better', value: clip(payload.disliked.trim()), step: 3 });
  if (payload.suggestions.trim())
    rows.push({ label: 'Ideas for next', value: clip(payload.suggestions.trim()), step: 4 });
  if (payload.name.trim() || payload.contact.trim()) {
    rows.push({
      label: 'Follow up',
      value: clip([payload.name.trim(), payload.contact.trim()].filter(Boolean).join(' · ')),
      step: 5,
    });
  }
  return rows;
}

interface ReviewScreenProps {
  answers: Answers;
  submitting: boolean;
  submitFailed: boolean;
  error: string;
  onSubmit: () => void;
  onEdit: (step: number) => void;
  onBack: () => void;
}

export function ReviewScreen({ answers, submitting, submitFailed, error, onSubmit, onEdit, onBack }: ReviewScreenProps) {
  const rows = buildRows(answers);

  return (
    <>
      <ScreenShell heading={'Your take. Your impact. \u{1F49C}'} support="Ready to send your feedback?">
        {rows.length > 0 ? (
          <motion.ul
            className="flex flex-col gap-2.5"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } } }}
          >
            {rows.map((row) => (
              <motion.li
                key={row.label}
                variants={{
                  hidden: { opacity: 0, y: 22, scale: 0.97 },
                  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
                }}
                whileHover={{ x: 2, transition: { duration: 0.18 } }}
                className="relative"
              >
                <motion.span
                  aria-hidden="true"
                  className="absolute left-0 top-2 bottom-2 w-[3px] origin-top rounded-full bg-lavender/50"
                  variants={{ hidden: { scaleY: 0 }, show: { scaleY: 1, transition: { duration: 0.35 } } }}
                />
                <button
                  type="button"
                  onClick={() => onEdit(row.step)}
                  className="flex w-full items-start justify-between gap-4 rounded-xl border border-lavender/20 bg-surface px-4 py-3.5 text-left transition-colors hover:border-lavender/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender focus-visible:ring-offset-2 focus-visible:ring-offset-midnight"
                >
                  <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">
                    {row.label}
                  </span>
                  <span className="min-w-0 break-words text-right text-sm text-ink">{row.value}</span>
                </button>
              </motion.li>
            ))}
          </motion.ul>
        ) : (
          <p className="rounded-xl border border-lavender/20 bg-surface px-4 py-3.5 text-sm text-muted">
            Nothing yet — tap a rating or share a thought, then come back here.
          </p>
        )}

        <div className="sticky bottom-0 z-10 mt-10 border-t border-white/5 bg-midnight/90 pt-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          {error && (
            <div role="alert" className="mb-3 rounded-2xl border border-yellow/40 bg-yellow/10 px-4 py-3 text-sm text-yellow">
              <p>{error}</p>
              {submitFailed && (
                <button
                  type="button"
                  onClick={onSubmit}
                  className="mt-2 min-h-[44px] rounded-xl border border-yellow/50 px-4 py-2 font-semibold transition-colors hover:bg-yellow/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender"
                >
                  Try again
                </button>
              )}
            </div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <button type="button" onClick={onBack} className={`${ghostButtonClass} order-2 w-full sm:order-1 sm:w-auto`}>
              Go back and edit
            </button>
            <motion.button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              whileHover={submitting ? undefined : { scale: 1.02 }}
              whileTap={submitting ? undefined : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              className={`${primaryButtonClass} order-1 w-full disabled:cursor-not-allowed disabled:opacity-60 sm:order-2 sm:w-auto`}
            >
              {/* sheen lives under the label (z-10) and hides while sending */}
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0"
                style={{
                  background: 'linear-gradient(110deg, transparent 34%, rgba(255,255,255,0.4) 50%, transparent 66%)',
                }}
                initial={{ x: '-40%', opacity: submitting ? 0 : 1 }}
                animate={{ x: ['-40%', '140%'], opacity: submitting ? 0 : 1 }}
                transition={{
                  x: { duration: 2.4, repeat: Infinity, ease: 'linear' },
                  opacity: { duration: 0.2 },
                }}
              />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    Send my feedback &#x1F680;
                  </>
                )}
              </span>
            </motion.button>
          </motion.div>
        </div>
      </ScreenShell>
    </>
  );
}
