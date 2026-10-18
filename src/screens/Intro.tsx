import { motion } from 'motion/react';
import { primaryButtonClass } from '../components/NavButtons';
import { Emblem } from '../components/Emblem';

const HEADLINE_WORDS = ['YOUR', 'VOICE.', 'OUR', 'WORSHIP.'];

interface IntroProps {
  onStart: () => void;
}

export function Intro({ onStart }: IntroProps) {
  return (
    <section className="relative pb-8">
      <div className="flex flex-col justify-center">
        <Emblem className="mx-auto mb-5 h-24 w-24 drop-shadow-[0_0_18px_rgba(232,199,122,0.25)] sm:h-28 sm:w-28" />
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-lavender/30 bg-surface px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-lavender"
        >
          ~30 seconds
        </motion.span>

        <h1 className="bg-gradient-to-br from-[#F5DFA6] via-[#E8C77A] to-[#B8862F] bg-clip-text font-display font-semibold leading-[1.05] text-[2.35rem] tracking-[-0.01em] text-transparent sm:text-[3rem]">
          {HEADLINE_WORDS.map((word, index) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.06 + index * 0.07 }}
              className={`mr-3 inline-block${index >= 2 ? ' italic' : ''}`}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.36 }}
          className="mt-6 max-w-md text-[17px] leading-[1.65] text-muted"
        >
          Church was more than a service. Tell us what stayed with you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.44 }}
          className="mt-8"
        >
          <motion.button
            type="button"
            onClick={onStart}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className={`${primaryButtonClass} w-full sm:w-auto`}
          >
            Let&rsquo;s talk &#x2728;
          </motion.button>
          <p className="mt-3 text-[13px] tracking-[0.02em] text-muted">No long forms. Just your honest take.</p>
        </motion.div>
      </div>
    </section>
  );
}
