import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import type { KeyboardEventHandler, Ref } from 'react';

interface OptionCardProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
  /** 'radio' renders a role="radio" card (rating); 'chip' renders an aria-pressed toggle. */
  variant?: 'radio' | 'chip';
  buttonRef?: Ref<HTMLButtonElement>;
  tabIndex?: number;
  onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
  highlighted?: boolean;
}

export function OptionCard({
  label,
  selected,
  onSelect,
  variant = 'chip',
  buttonRef,
  tabIndex,
  onKeyDown,
  highlighted = false,
}: OptionCardProps) {
  const base =
    'flex w-full items-center justify-between gap-3 break-words rounded-card border px-4 py-3.5 text-left text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender focus-visible:ring-offset-2 focus-visible:ring-offset-midnight sm:text-base min-h-[48px]';
  const state = selected
    ? 'border-lavender bg-lavender/15 text-ink'
    : highlighted
      ? 'border-lime/70 bg-lime/5 text-ink'
      : 'border-lavender/20 bg-surface text-ink hover:border-lavender/50';

  return (
    <motion.button
      type="button"
      ref={buttonRef}
      role={variant === 'radio' ? 'radio' : undefined}
      aria-checked={variant === 'radio' ? selected : undefined}
      aria-pressed={variant === 'chip' ? selected : undefined}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      onClick={onSelect}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.975 }}
      animate={{ scale: selected ? 1.02 : 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
      className={`${base} ${state}`}
    >
      <span className="min-w-0 flex-1 text-left break-words">{label}</span>
      <motion.span
        className="flex-shrink-0"
        animate={selected ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 24 }}
      >
        <Check className="h-5 w-5 shrink-0 text-lime" aria-hidden="true" />
      </motion.span>
    </motion.button>
  );
}
