import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { primaryButtonClass, ghostButtonClass } from '../components/NavButtons';

interface SuccessScreenProps {
  onDone: () => void;
  onSendAnother: () => void;
}

const successContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.55 } },
};

const successItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
};

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
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </svg>
        </motion.span>
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 h-16 w-16 rounded-full border-2 border-lavender"
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: [0.8, 1.6], opacity: [0.5, 0] }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </div>
      <motion.h1
        tabIndex={-1}
        variants={successItem}
        className="font-display text-3xl font-bold leading-tight text-ink focus:outline-none sm:text-4xl"
      >
        {'You\u2019re heard. Always. \u{1F49C}'}
      </motion.h1>
      <motion.p variants={successItem} className="mt-4 text-lg leading-relaxed text-muted">
        Thanks for keeping it real. Your feedback helps us make GNWY better.
      </motion.p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <motion.button
          type="button"
          onClick={onDone}
          variants={successItem}
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
      </div>
    </motion.section>
  );
}
