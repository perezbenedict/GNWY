import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface ProgressProps {
  step: number;
  total: number;
}

// gold resting/burst glow mirrors getdroppy.app's dlStepGlow keyframes
const DOT_GLOW_REST = '0 0 6px rgba(232,199,122,0.4)';
const DOT_GLOW_BURST = '0 0 22px rgba(232,199,122,0.95)';

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
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="relative h-full w-full origin-left rounded-full bg-lavender"
          // Progress remounts per screen, so the fill grows in from zero instead of appearing at width
          initial={reduced ? false : { width: '0%' }}
          animate={{ width: `${(step / total) * 100}%` }}
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 140, damping: 22 }}
        >
          {/* luminous leading edge; absolutely positioned so the bar's height/footprint is unchanged.
              y must live in motion's transform (not just -translate-y-1/2) or the inline transform wins. */}
          <motion.span
            aria-hidden="true"
            className="absolute right-0 top-1/2 h-0.5 w-0.5 -translate-y-1/2 rounded-full bg-white"
            initial={{ y: '-50%', scale: 1, boxShadow: DOT_GLOW_REST }}
            animate={
              reduced
                ? { y: '-50%', boxShadow: DOT_GLOW_REST }
                : {
                    y: '-50%',
                    scale: [1, 1.8, 1],
                    boxShadow: [DOT_GLOW_REST, DOT_GLOW_BURST, DOT_GLOW_REST],
                  }
            }
            transition={reduced ? { duration: 0 } : { duration: 0.8, delay: 0.25 }}
          />
        </motion.div>
        {/* shimmer sweep: sibling of the fill so the fill never clips the dot's glow; track's overflow-hidden masks it */}
        {!reduced && (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-1/3"
            style={{
              background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.45), transparent)',
            }}
            animate={{ x: ['-120%', '420%'] }}
            transition={{ duration: 1.6, delay: 0.3, repeat: 2, ease: 'linear' }}
          />
        )}
      </div>
    </div>
  );
}
