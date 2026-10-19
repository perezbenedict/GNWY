import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { OptionCard } from '../components/OptionCard';
import { NavButtons } from '../components/NavButtons';
import { ScreenShell } from '../components/ScreenShell';
import { TextField } from '../components/TextField';

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export const IMPROVE_OPTIONS = [
  'The sound and production \u{1F3A4}',
  'The timing \u23F0',
  'The venue or seating \u{1FA91}',
  'The worship \u{1F3B6}',
  'The message \u{1F4D6}',
  'The welcome and hospitality \u{1F91D}',
  'Something else \u{1F4AD}',
  "Nothing comes to mind. We're good \u2705",
];

export const NOTHING_OPTION = IMPROVE_OPTIONS[IMPROVE_OPTIONS.length - 1];

interface ImproveScreenProps {
  selected: string[];
  text: string;
  onToggle: (label: string) => void;
  onTextChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export function ImproveScreen({ selected, text, onToggle, onTextChange, onBack, onNext, onSkip }: ImproveScreenProps) {
  // Exclusivity (selecting "Nothing..." clears others) is handled by the toggle callback in App.
  return (
    <>
      <ScreenShell
        heading={'Be honest. We can take it. \u{1F440}'}
        question="What could have been better?"
        support="Your feedback helps us make the next service better."
        progress={{ step: 3, total: 5 }}
      >
        <motion.div
          className="flex flex-col gap-3"
          role="group"
          aria-label="What could have been better"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {IMPROVE_OPTIONS.map((label) => (
            <motion.div key={label} className="w-full" variants={itemVariants}>
              <OptionCard
                label={label}
                selected={selected.includes(label)}
                onSelect={() => onToggle(label)}
              />
            </motion.div>
          ))}
        </motion.div>
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 + IMPROVE_OPTIONS.length * 0.07 }}
        >
          <TextField
            label="Anything else?"
            placeholder={'Anything that could\u2019ve made the experience better?'}
            value={text}
            onChange={onTextChange}
            multiline
            optional
          />
        </motion.div>
      </ScreenShell>
      <NavButtons onBack={onBack} onNext={onNext} onSkip={onSkip} />
    </>
  );
}
