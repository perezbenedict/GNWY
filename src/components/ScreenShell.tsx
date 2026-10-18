import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { Progress } from './Progress';

const shellVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

const slotVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
};

interface ScreenShellProps {
  heading: string;
  question?: string;
  support: string;
  progress?: { step: number; total: number };
  children: ReactNode;
}

export function ScreenShell({ heading, question, support, progress, children }: ScreenShellProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <motion.section className="pb-4" variants={shellVariants} initial="hidden" animate="show">
      {progress && (
        <motion.div variants={slotVariants}>
          <Progress step={progress.step} total={progress.total} />
        </motion.div>
      )}
      <motion.h1
        ref={headingRef}
        tabIndex={-1}
        variants={slotVariants}
        className="font-display text-[2rem] font-semibold leading-[1.08] tracking-[-0.015em] text-ink focus:outline-none sm:text-[2.6rem]"
      >
        {heading}
      </motion.h1>
      {question && (
        <motion.div variants={slotVariants}>
          <h2 className="mt-4 bg-gradient-to-br from-[#F5DFA6] via-[#E8C77A] to-[#B8862F] bg-clip-text font-display text-[1.3rem] font-normal italic leading-snug text-transparent sm:text-[1.55rem]">{question}</h2>
        </motion.div>
      )}
      <motion.p className="mt-3 text-[15px] leading-[1.65] tracking-[0.01em] text-muted" variants={slotVariants}>
        {support}
      </motion.p>
      <div className="mt-6 h-px w-12 bg-gradient-to-r from-lavender/70 to-transparent" />
      <motion.div className="mt-8" variants={slotVariants}>
        {children}
      </motion.div>
    </motion.section>
  );
}
