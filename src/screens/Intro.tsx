import { Fragment, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { primaryButtonClass } from '../components/NavButtons';
import { Emblem } from '../components/Emblem';

const HEADLINE_WORDS = ['YOUR', 'VOICE.', 'OUR', 'WORSHIP.'];
const SEEN_KEY = 'gnwy_intro_seen';
const REVEAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface IntroProps {
  onStart: () => void;
}

export function Intro({ onStart }: IntroProps) {
  const [seen] = useState(() => {
    try {
      return sessionStorage.getItem(SEEN_KEY) === '1';
    } catch {
      // private mode: no storage access, fall back to first-visit entrance
      return false;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      // private mode: entrance simply plays again next visit
    }
  }, []);

  return (
    <section className="relative pb-8">
      <div className="flex flex-col justify-center">
        <motion.span
          initial={seen ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={seen ? { duration: 0.15 } : { type: 'spring', stiffness: 260, damping: 24 }}
          className="mx-auto mb-5 flex h-24 w-24 drop-shadow-[0_0_18px_rgba(232,199,122,0.25)] sm:h-28 sm:w-28"
        >
          <Emblem className="h-full w-full" />
        </motion.span>
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
            <Fragment key={word}>
              {index > 0 && ' '}
              <motion.span
                initial={seen ? { opacity: 0 } : { opacity: 0, y: '110%' }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  seen
                    ? { duration: 0.25, ease: 'easeOut' }
                    : { duration: 0.6, ease: REVEAL_EASE, delay: 0.08 + index * 0.06 }
                }
                className={`inline-block${index >= 2 ? ' italic' : ''}`}
              >
                {word}
              </motion.span>
            </Fragment>
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
          initial={seen ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: seen ? 0.15 : 0.45,
            ease: 'easeOut',
            delay: seen ? 0.05 : 0.55,
          }}
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
