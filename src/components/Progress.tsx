import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface ProgressProps {
  step: number;
  total: number;
}

export function Progress({ step, total }: ProgressProps) {
  // MotionConfig's reducedMotion only covers transforms/layout, so the width spring needs its own guard
  const reduced = useReducedMotion() === true;

  return (
    <div className="mb-8">
      <div className="relative mb-2 h-5 w-24 overflow-hidden" aria-live="polite">
        {/* initial={false} removed: Progress remounts per screen, so the step roll plays on mount. */}
        <AnimatePresence mode="wait">
          <motion.span
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] tabular-nums text-muted"
          >
            {String(step).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="relative h-full w-full origin-left rounded-full bg-lavender"
          // Progress remounts per screen, so the fill grows in from zero instead of appearing at width
          initial={reduced ? false : { width: '0%' }}
          animate={{ width: `${(step / total) * 100}%` }}
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 140, damping: 22 }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 h-full w-full animate-[shimmer_2.5s_linear_infinite]"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
              backgroundSize: '200% 100%',
            }}
          />
          {/* luminous leading edge; absolutely positioned so the bar's height/footprint is unchanged */}
          <span
            aria-hidden="true"
            className="absolute right-0 top-1/2 h-0.5 w-0.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_6px_2px_rgba(255,255,255,0.8)]"
          />
        </motion.div>
      </div>
    </div>
  );
}
