import { motion, useReducedMotion } from 'motion/react';
import { primaryButtonClass } from '../components/NavButtons';
import { Emblem } from '../components/Emblem';

const HEADLINE_WORDS = ['YOUR', 'VOICE.', 'OUR', 'WORSHIP.'];

interface IntroProps {
  onStart: () => void;
}

export function Intro({ onStart }: IntroProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative pb-8">
      {!reduceMotion && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
          <motion.div
            className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-crimson/10 blur-3xl"
            animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
            transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -right-20 top-40 h-64 w-64 rounded-full bg-lavender/15 blur-3xl"
            animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}

      <div className="flex flex-col justify-center">
        <Emblem className="mx-auto mb-5 h-24 w-24 drop-shadow-[0_0_18px_rgba(232,199,122,0.25)] sm:h-28 sm:w-28" />
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-lavender/30 bg-surface px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-lavender"
        >
          ~30 seconds
        </motion.span>

        <h1 className="bg-gradient-to-br from-[#F5DFA6] via-[#E8C77A] to-[#B8862F] bg-clip-text font-display font-semibold leading-[1.05] text-[2.35rem] tracking-[-0.01em] text-transparent sm:text-[3rem]">
          {HEADLINE_WORDS.map((word, index) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.08 }}
              className={`mr-3 inline-block${index >= 2 ? ' italic' : ''}`}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.36 }}
          className="mt-6 max-w-md text-[17px] leading-[1.65] text-muted"
        >
          Church was more than a service. Tell us what stayed with you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.44 }}
          className="mt-8"
        >
          <motion.button
            type="button"
            onClick={onStart}
            whileHover={{ scale: 1.03 }}
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
