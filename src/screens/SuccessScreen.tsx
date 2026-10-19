import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { primaryButtonClass, ghostButtonClass } from '../components/NavButtons';

interface SuccessScreenProps {
  onDone: () => void;
  onSendAnother: () => void;
}

const successContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.7 } },
};

const successItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
};

// heading overshoots slightly (brew-copied-pop)
const headingItem: Variants = {
  hidden: { opacity: 0, scale: 0.88, y: 10 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 15, delay: 0.5 },
  },
};

const doneItem: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: [0.92, 1.06, 1],
    transition: { duration: 0.45, ease: 'easeOut', delay: 1.0 },
  },
};

const ringDelays = [0, 0.18, 0.36];
const PARTICLE_DISTANCE = [46, 92, 58, 80, 66, 49, 88, 54, 74, 61, 90, 70];

export function SuccessScreen({ onDone, onSendAnother }: SuccessScreenProps) {
  return (
    <motion.section
      className="flex min-h-[calc(100svh-8rem)] flex-col justify-center py-10"
      variants={successContainer}
      initial="hidden"
      animate="show"
    >
      <div className="relative mb-6">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 18 }}
          className="relative inline-flex"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-16 w-16 text-lime"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <motion.path
              d="m9 12 2 2 4-4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            />
          </svg>
        </motion.span>
        {ringDelays.map((delay) => (
          <motion.span
            key={delay}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 h-16 w-16 rounded-full border-2 border-lavender"
            initial={{ scale: 0.7, opacity: 0.55 }}
            animate={{ scale: [0.7, 1.9], opacity: [0.55, 0] }}
            transition={{ duration: 1.0, ease: 'easeOut', delay }}
          />
        ))}
        {/* gold particle burst, radiating from the check's center (32,32) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {PARTICLE_DISTANCE.map((dist, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const size = 6 + (i % 3);
            return (
              <motion.span
                key={i}
                aria-hidden="true"
                className="absolute rounded-full"
                style={{
                  left: 32 - size / 2,
                  top: 32 - size / 2,
                  width: size,
                  height: size,
                  background: i % 4 === 0 ? '#F5DFAE' : '#E8C77A',
                }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{
                  x: Math.cos(angle) * dist,
                  y: Math.sin(angle) * dist,
                  scale: [0, 1.2, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{ duration: 0.95, delay: 0.25 + i * 0.025, ease: 'easeOut' }}
              />
            );
          })}
        </div>
      </div>
      <motion.h1
        tabIndex={-1}
        variants={headingItem}
        className="font-display text-3xl font-bold leading-tight text-ink focus:outline-none sm:text-4xl"
      >
        {'You\u2019re heard. Always. \u{1F49C}'}
      </motion.h1>
      <motion.p variants={successItem} className="mt-4 text-lg leading-relaxed text-muted">
        Thanks for keeping it real. Your feedback helps us make GNWY better.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.95 }}
        className="mt-8 flex flex-col gap-3 sm:flex-row"
      >
        <motion.button
          type="button"
          onClick={onDone}
          variants={doneItem}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
          className={`${primaryButtonClass} w-full sm:w-auto`}
        >
          {'Done \u2728'}
        </motion.button>
        <motion.button
          type="button"
          onClick={onSendAnother}
          variants={successItem}
          className={`${ghostButtonClass} w-full sm:w-auto`}
        >
          Send another response
        </motion.button>
      </motion.div>
    </motion.section>
  );
}
