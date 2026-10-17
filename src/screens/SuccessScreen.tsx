import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { primaryButtonClass, ghostButtonClass } from '../components/NavButtons';

interface SuccessScreenProps {
  onDone: () => void;
  onSendAnother: () => void;
}

export function SuccessScreen({ onDone, onSendAnother }: SuccessScreenProps) {
  return (
    <section className="flex min-h-[calc(100svh-8rem)] flex-col justify-center py-10">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="mb-6"
      >
        <CheckCircle2 className="h-16 w-16 text-lime" aria-hidden="true" />
      </motion.div>
      <h1
        tabIndex={-1}
        className="font-display text-3xl font-bold leading-tight text-ink focus:outline-none sm:text-4xl"
      >
        {'You\u2019re heard. Always. \u{1F49C}'}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        Thanks for keeping it real. Your feedback helps us make GNWY better.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <motion.button
          type="button"
          onClick={onDone}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
          className={`${primaryButtonClass} w-full sm:w-auto`}
        >
          {'Done \u2728'}
        </motion.button>
        <button type="button" onClick={onSendAnother} className={`${ghostButtonClass} w-full sm:w-auto`}>
          Send another response
        </button>
      </div>
    </section>
  );
}
