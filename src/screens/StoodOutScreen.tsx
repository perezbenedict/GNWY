import { motion } from 'motion/react';
import { OptionCard } from '../components/OptionCard';
import { NavButtons } from '../components/NavButtons';
import { ScreenShell } from '../components/ScreenShell';
import { TextField } from '../components/TextField';

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
        <div className="flex flex-wrap gap-2.5" role="group" aria-label="What stood out today">
          {STOOD_OUT_OPTIONS.map((label, index) => (
            <motion.div
              key={label}
              className="w-full"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: Math.min(index * 0.04, 0.4) }}
            >
              <OptionCard
                label={label}
                selected={selected.includes(label)}
                onSelect={() => onToggle(label)}
              />
            </motion.div>
          ))}
        </div>
        <div className="mt-6">
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
        </div>
      </ScreenShell>
      <NavButtons onBack={onBack} onNext={onNext} onSkip={onSkip} />
    </>
  );
}
