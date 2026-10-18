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
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
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
              {/* Pop like a star fill: the chosen option and everything below it. */}
              <motion.div
                animate={{ scale: rating !== null && option.value !== null && rating >= option.value ? [1, 1.12, 1] : 1 }}
                transition={{ duration: 0.35 }}
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
