import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { OptionCard } from '../components/OptionCard';
import { NavButtons } from '../components/NavButtons';
import { ScreenShell } from '../components/ScreenShell';
import { TextField } from '../components/TextField';

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

export const STOOD_OUT_OPTIONS = [
  'The worship was something else \u{1F3B6}',
  'The Word spoke to me \u{1F4D6}',
  'Prayer hit home \u{1F64F}',
  'The whole atmosphere \u2728',
  'The people and connection \u{1FAC2}',
  'Something else entirely \u{1F4AD}',
];

const MAX_CHARS = 280;

interface StoodOutScreenProps {
  selected: string[];
  text: string;
  onToggle: (label: string) => void;
  onTextChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export function StoodOutScreen({ selected, text, onToggle, onTextChange, onBack, onNext, onSkip }: StoodOutScreenProps) {
  return (
    <>
      <ScreenShell
        heading={'What hit different today? \u2728'}
        support="That moment you are still thinking about? Tell us."
        progress={{ step: 2, total: 5 }}
      >
        <motion.div
          className="flex flex-wrap gap-2.5"
          role="group"
          aria-label="What stood out today"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {STOOD_OUT_OPTIONS.map((label) => (
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.12 + STOOD_OUT_OPTIONS.length * 0.05 }}
        >
          <TextField
            label="Tell us more"
            placeholder={'That song, that word, that moment… what was it?'}
            value={text}
            onChange={onTextChange}
            multiline
            optional
            maxLength={MAX_CHARS}
            showCounter
          />
        </motion.div>
      </ScreenShell>
      <NavButtons onBack={onBack} onNext={onNext} onSkip={onSkip} />
    </>
  );
}
