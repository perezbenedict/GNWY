import { AnimatePresence, motion } from 'motion/react';

interface ProgressProps {
  step: number;
  total: number;
}

export function Progress({ step, total }: ProgressProps) {
  return (
    <div className="mb-8">
      <div className="relative mb-2 h-5 w-24 overflow-hidden" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={step}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="font-display text-sm font-semibold tracking-widest text-muted"
          >
            {String(step).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full w-full origin-left rounded-full bg-lavender"
          initial={false}
          animate={{ scaleX: step / total }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        />
      </div>
    </div>
  );
}
