import { motion } from 'motion/react';

export const primaryButtonClass =
  'inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-violet px-6 py-3.5 text-base font-semibold text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender focus-visible:ring-offset-2 focus-visible:ring-offset-midnight sm:flex-none';

export const ghostButtonClass =
  'inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/15 px-5 py-3.5 text-base font-medium text-muted transition-colors hover:border-lavender/60 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender focus-visible:ring-offset-2 focus-visible:ring-offset-midnight';

interface NavButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  onSkip?: () => void;
  skipLabel?: string;
}

export function NavButtons({ onBack, onNext, nextLabel = 'Next', onSkip, skipLabel = 'Skip' }: NavButtonsProps) {
  return (
    <div
      className="sticky bottom-0 z-10 mt-10 border-t border-white/5 bg-midnight/90 pt-3 backdrop-blur"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-3">
        {onBack && (
          <button type="button" onClick={onBack} className={ghostButtonClass}>
            Back
          </button>
        )}
        {onSkip && (
          <button type="button" onClick={onSkip} className={ghostButtonClass}>
            {skipLabel}
          </button>
        )}
        {onNext && (
          <motion.button
            type="button"
            onClick={onNext}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
            className={primaryButtonClass}
          >
            {nextLabel}
          </motion.button>
        )}
      </div>
    </div>
  );
}
