import { useEffect, useRef } from 'react';
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

export const NEXT_OPTIONS = [
  'More youth hangouts \u{1F389}',
  'More worship sessions \u{1F3B6}',
  'Real conversations about life \u{1F4AC}',
  'Bible study that connects to real life \u{1F4D6}',
  'Games and interactive activities \u{1F3AE}',
  'More ways to connect with people \u{1FAC2}',
  'I have my own idea \u{1F4A1}',
];

export const IDEA_OPTION = NEXT_OPTIONS[NEXT_OPTIONS.length - 1];

interface NextScreenProps {
  selected: string[];
  ideaCustom: string;
  onToggle: (label: string) => void;
  onIdeaCustomChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export function NextScreen({
  selected,
  ideaCustom,
  onToggle,
  onIdeaCustomChange,
  onBack,
  onNext,
  onSkip,
}: NextScreenProps) {
  const ideaSelected = selected.includes(IDEA_OPTION);
  const ideaInputRef = useRef<HTMLTextAreaElement>(null);
  const wasIdeaSelected = useRef(ideaSelected);

  useEffect(() => {
    if (ideaSelected && !wasIdeaSelected.current) ideaInputRef.current?.focus();
    wasIdeaSelected.current = ideaSelected;
  }, [ideaSelected]);

  return (
    <>
      <ScreenShell
        heading={'What should we do more of? \u{1F440}'}
        support="Help us make the next one even better."
        progress={{ step: 4, total: 5 }}
      >
        <motion.div
          className="flex flex-col gap-3"
          role="group"
          aria-label="What should we do more of"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {NEXT_OPTIONS.map((label) => (
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
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.12 + NEXT_OPTIONS.length * 0.05 }}
        >
          <TextField
            label="Your idea"
            placeholder={'Drop your idea. We are listening \u{1F440}'}
            value={ideaCustom}
            onChange={onIdeaCustomChange}
            multiline
            optional
            highlighted={ideaSelected}
            inputRef={ideaInputRef}
          />
        </motion.div>
      </ScreenShell>
      <NavButtons onBack={onBack} onNext={onNext} onSkip={onSkip} />
    </>
  );
}
