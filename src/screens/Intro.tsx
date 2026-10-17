import { motion, useReducedMotion } from 'motion/react';
import { primaryButtonClass } from '../components/NavButtons';

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
        <svg
          viewBox="0 0 120 120"
          role="img"
          aria-label="Grace Nation Wealthy Youths emblem"
          className="mx-auto mb-5 h-24 w-24 drop-shadow-[0_0_18px_rgba(232,199,122,0.25)] sm:h-28 sm:w-28"
        >
          <defs>
            <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F5DFA6" />
              <stop offset="55%" stopColor="#E8C77A" />
              <stop offset="100%" stopColor="#B8862F" />
            </linearGradient>
            <radialGradient id="globeFill" cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#1E3A6B" />
              <stop offset="100%" stopColor="#0C1A38" />
            </radialGradient>
            <linearGradient id="flameFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D8324C" />
              <stop offset="100%" stopColor="#B3223A" />
            </linearGradient>
            <clipPath id="globeClip">
              <circle cx="60" cy="60" r="35" />
            </clipPath>
          </defs>
          <circle cx="60" cy="60" r="56" fill="none" stroke="url(#gold)" strokeWidth="1.6" />
          <circle cx="60" cy="60" r="50.5" fill="none" stroke="url(#gold)" strokeWidth="0.8" opacity="0.65" />
          <circle cx="60" cy="60" r="35" fill="url(#globeFill)" />
          <g clipPath="url(#globeClip)" fill="none" stroke="#C9D1DE" strokeWidth="0.9" opacity="0.65">
            <circle cx="60" cy="60" r="35" />
            <ellipse cx="60" cy="60" rx="12" ry="35" />
            <ellipse cx="60" cy="60" rx="24" ry="35" />
            <line x1="25" y1="60" x2="95" y2="60" />
            <path d="M31 42 H89" />
            <path d="M31 78 H89" />
          </g>
          <path
            d="M60 26 C 69 43, 78 52, 75 67 C 72.5 79, 65 87, 60 90 C 55 87, 47.5 79, 45 67 C 42 52, 51 43, 60 26 Z"
            fill="url(#flameFill)"
          />
          <path
            d="M60 49 C 64.5 59, 69 63.5, 67 71 C 65.4 77, 62 80, 60 81 C 58 80, 54.6 77, 53 71 C 51 63.5, 55.5 59, 60 49 Z"
            fill="url(#gold)"
            opacity="0.95"
          />
        </svg>
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-lavender/30 bg-surface px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-lavender"
        >
          ~30 seconds
        </motion.span>

        <h1 className="bg-gradient-to-br from-[#F5DFA6] via-[#E8C77A] to-[#B8862F] bg-clip-text font-display font-semibold leading-[1.06] text-[2.5rem] tracking-[-0.01em] text-transparent sm:text-[3.25rem]">
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
