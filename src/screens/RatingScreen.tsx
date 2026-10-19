import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { OptionCard } from '../components/OptionCard';
import { NavButtons } from '../components/NavButtons';
import { ScreenShell } from '../components/ScreenShell';
import type { Answers } from '../types';

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export const RATING_OPTIONS: ReadonlyArray<{ label: string; value: Answers['rating'] }> = [
  { label: '10/10. I felt that. \u{1F525}', value: 5 },
  { label: 'Really good \u{1F64C}', value: 4 },
  { label: 'It was alright \u{1F642}', value: 3 },
  { label: 'Could hit different \u{1F622}', value: 2 },
  { label: 'Not my best experience \u{1F636}', value: 1 },
];

interface RatingScreenProps {
  rating: Answers['rating'];
  onSelect: (value: Answers['rating']) => void;
  onBack: () => void;
  onNext: () => void;
}

export function RatingScreen({ rating, onSelect, onBack, onNext }: RatingScreenProps) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = -1;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (index + 1) % RATING_OPTIONS.length;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft')
      nextIndex = (index - 1 + RATING_OPTIONS.length) % RATING_OPTIONS.length;
    if (nextIndex < 0) return;
    event.preventDefault();
    onSelect(RATING_OPTIONS[nextIndex].value);
    optionRefs.current[nextIndex]?.focus();
  };

  return (
    <>
      <ScreenShell
        heading={'First things first… \u{1F440}'}
        question="How was service today?"
        support="No pressure. Give us your honest take."
        progress={{ step: 1, total: 5 }}
      >
        <motion.div
          role="radiogroup"
          aria-label="How was service today?"
          className="flex flex-col gap-3"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {RATING_OPTIONS.map((option, index) => (
            <motion.div key={option.label} className="w-full" variants={itemVariants}>
              {/* Subtle nudge on every filled star; gold halo only on the exact pick. */}
              <motion.div
                animate={
                  rating !== null && option.value !== null
                    ? {
                        scale: rating >= option.value ? [1, 1.04, 1] : 1,
                        boxShadow:
                          rating === option.value
                            ? [
                                '0 0 0 rgba(232,199,122,0)',
                                '0 0 26px rgba(232,199,122,0.5)',
                                '0 0 0 rgba(232,199,122,0)',
                              ]
                            : '0 0 0 rgba(232,199,122,0)',
                      }
                    : { scale: 1, boxShadow: '0 0 0 rgba(232,199,122,0)' }
                }
                transition={{ duration: 0.4 }}
              >
                <OptionCard
                  variant="radio"
                  label={option.label}
                  selected={rating === option.value}
                  onSelect={() => onSelect(option.value)}
                  buttonRef={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  tabIndex={rating === option.value || (rating === null && index === 0) ? 0 : -1}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </ScreenShell>
      <NavButtons onBack={onBack} onNext={onNext} />
    </>
  );
}
