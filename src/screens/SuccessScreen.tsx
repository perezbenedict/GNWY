import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { primaryButtonClass, ghostButtonClass } from '../components/NavButtons';

interface SuccessScreenProps {
  onDone: () => void;
  onSendAnother: () => void;
}

const successContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
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
          className="inline-flex"
        >
          <CheckCircle2 className="h-16 w-16 text-lime" aria-hidden="true" />
        </motion.span>
        <motion.span
          aria-hidden="true"
          className="absolute left-0 top-0 h-16 w-16 rounded-full border-2 border-lavender"
          initial={{ scale: 1, opacity: 0.35 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <motion.h1
        tabIndex={-1}
        variants={successItem}
        className="font-display text-3xl font-bold leading-tight text-ink focus:outline-none sm:text-4xl"
      >
        {'You\u2019re heard. Always. \u{1F49C}'}
      </motion.h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        Thanks for keeping it real. Your feedback helps us make GNWY better.
      </p>
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
