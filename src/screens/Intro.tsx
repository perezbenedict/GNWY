import { Fragment, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { primaryButtonClass } from '../components/NavButtons';
import { Emblem } from '../components/Emblem';

const HEADLINE_WORDS = ['YOUR', 'VOICE.', 'OUR', 'WORSHIP.'];
const REVEAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const EMBLEM_VARIANTS = {
  enter: { opacity: 0, scale: 0.85, y: 10 },
  active: { opacity: 1, scale: 1, y: 0, rotate: [0, 1.5, 0, -1.5, 0] },
};

interface IntroProps {
  onStart: () => void;
}

export function Intro({ onStart }: IntroProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const spotX = useMotionValue(0);
  const spotY = useMotionValue(0);
  const spotSX = useSpring(spotX, { stiffness: 120, damping: 18, mass: 0.5 });
  const spotSY = useSpring(spotY, { stiffness: 120, damping: 18, mass: 0.5 });
  const spotOpacity = useSpring(0, { stiffness: 120, damping: 20, mass: 0.4 });

  const magnetX = useMotionValue(0);
  const magnetY = useMotionValue(0);
  const magnetSX = useSpring(magnetX, { stiffness: 250, damping: 18 });
  const magnetSY = useSpring(magnetY, { stiffness: 250, damping: 18 });

  const handleRootPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (reduceMotion || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    spotX.set(event.clientX - rect.left - rect.width / 2);
    spotY.set(event.clientY - rect.top - rect.height / 2);
    spotOpacity.set(1);
  };

  const handleMagnetMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reduceMotion || !ctaRef.current) return;
    const rect = ctaRef.current.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const distance = Math.hypot(dx, dy);
    if (distance >= 90) {
      magnetX.set(0);
      magnetY.set(0);
      return;
    }
    const pull = (1 - distance / 90) * 8;
    magnetX.set((dx / (distance || 1)) * pull);
    magnetY.set((dy / (distance || 1)) * pull);
  };

  const handleMagnetLeave = () => {
    magnetX.set(0);
    magnetY.set(0);
  };

  return (
    <section ref={rootRef} onPointerMove={handleRootPointerMove} className="relative pb-8">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(420px circle at 50% 50%, rgba(232,199,122,0.12) 0%, transparent 70%)',
          opacity: reduceMotion ? 0 : spotOpacity,
          x: spotSX,
          y: spotSY,
        }}
      />
      <div className="flex flex-col justify-center">
        <motion.span
          variants={EMBLEM_VARIANTS}
          initial="enter"
          animate="active"
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 16,
            mass: 0.9,
            rotate: { duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.6 },
          }}
          className="mx-auto mb-5 flex h-24 w-24 drop-shadow-[0_0_18px_rgba(232,199,122,0.25)] sm:h-28 sm:w-28"
        >
          <Emblem className="h-full w-full" />
        </motion.span>
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: REVEAL_EASE, delay: 0.2 }}
          className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-lavender/30 bg-surface px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-lavender"
        >
          ~30 seconds
        </motion.span>

        <h1 className="relative overflow-hidden bg-gradient-to-br from-[#F5DFA6] via-[#E8C77A] to-[#B8862F] bg-clip-text font-display font-semibold leading-[1.05] text-[2.35rem] tracking-[-0.01em] text-transparent sm:text-[3rem]">
          {HEADLINE_WORDS.map((word, index) => (
            <Fragment key={word}>
              {index > 0 && ' '}
              <span
                className={`inline-block overflow-hidden align-top pb-[0.12em]${
                  index >= 2 ? ' italic' : ''
                }`}
              >
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: '115%' }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: REVEAL_EASE, delay: 0.35 + index * 0.07 }}
                >
                  <motion.span
                    className="inline-block"
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: [1, 1.06, 1], opacity: [1, 0.8, 1] }}
                    transition={{
                      duration: 0.35,
                      ease: 'easeInOut',
                      delay: 0.35 + index * 0.07 + 0.7,
                    }}
                  >
                    {word}
                  </motion.span>
                </motion.span>
              </span>
            </Fragment>
          ))}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-24 -skew-x-12"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(232,199,122,0.45), transparent)' }}
            initial={{ left: '-20%' }}
            animate={{ left: '120%' }}
            transition={{ duration: 0.9, ease: 'easeInOut', delay: 1 }}
          />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: REVEAL_EASE, delay: 0.75 }}
          className="mt-6 max-w-md text-[17px] leading-[1.65] text-muted"
        >
          Church was more than a service. Tell us what stayed with you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: REVEAL_EASE, delay: 1.15 }}
          className="mt-8"
        >
          <div ref={ctaRef} onPointerMove={handleMagnetMove} onPointerLeave={handleMagnetLeave}>
            <motion.div style={{ x: magnetSX, y: magnetSY }}>
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
            </motion.div>
          </div>
          <p className="mt-3 text-[13px] tracking-[0.02em] text-muted">No long forms. Just your honest take.</p>
        </motion.div>
      </div>
    </section>
  );
}
