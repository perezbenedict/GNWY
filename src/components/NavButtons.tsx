import { motion } from 'motion/react';

export const primaryButtonClass =
  'inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#F5DFA6,#E8C77A_55%,#B8862F)] px-6 py-3.5 text-[14px] font-semibold text-center uppercase leading-tight tracking-[0.14em] text-[#171105] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender focus-visible:ring-offset-2 focus-visible:ring-offset-midnight sm:flex-none relative overflow-hidden';

export const ghostButtonClass =
  'inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/15 px-5 py-3.5 text-[13px] font-semibold text-center uppercase leading-tight tracking-[0.12em] text-muted transition-colors hover:border-lavender/60 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender focus-visible:ring-offset-2 focus-visible:ring-offset-midnight';

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
          <motion.button
            type="button"
            onClick={onBack}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className={ghostButtonClass}
          >
            Back
          </motion.button>
        )}
        {onSkip && (
          <motion.button
            type="button"
            onClick={onSkip}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className={ghostButtonClass}
          >
            {skipLabel}
          </motion.button>
        )}
        {onNext && (
          <motion.button
            type="button"
            onClick={onNext}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
            className={primaryButtonClass}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 bottom-0 z-0 w-[40%] animate-[sheen_0.9s_ease-out_0.4s_1]"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                // resting off-screen so the band never shows before/after the sweep (or under reduced motion)
                transform: 'translateX(-120%) skewX(-18deg)',
              }}
            />
            <span className="relative z-10">{nextLabel}</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
