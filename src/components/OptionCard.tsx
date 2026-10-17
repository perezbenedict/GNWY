import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import type { KeyboardEventHandler, Ref } from 'react';

// Trailing emoji (with variation selectors/ZWJ) so it can pop separately from the label text.
const TRAILING_EMOJI = /(\s)(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)$/u;

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
    'relative flex w-full items-center justify-between gap-3 break-words rounded-card border px-4 py-3.5 text-left text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender focus-visible:ring-offset-2 focus-visible:ring-offset-midnight sm:text-base min-h-[48px]';
  const state = selected
    ? 'border-lavender bg-lavender/15 text-ink'
    : highlighted
      ? 'border-lime/70 bg-lime/5 text-ink'
      : 'border-lavender/20 bg-surface text-ink hover:border-lavender/50';

  const emojiMatch = label.match(TRAILING_EMOJI);
  // Keep the rendered text identical to `label` (textContent must not change).
  const head = emojiMatch ? label.slice(0, emojiMatch.index) + emojiMatch[1] : label;
  const emoji = emojiMatch ? emojiMatch[2] : '';

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
      animate={{ scale: selected ? 1.015 : 1 }}
      transition={{ type: 'spring', stiffness: 480, damping: 20 }}
      className={`${base} ${state}`}
    >
      {/* Gold flash; needs the button as positioning context, hence `relative` above. */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{ background: 'radial-gradient(circle at center, rgba(232,199,122,0.18), transparent 70%)' }}
        animate={{ opacity: selected ? 1 : 0 }}
        transition={{ duration: 0.35 }}
      />
      <span className="min-w-0 flex-1 text-left break-words">
        {head}
        {emoji && (
          <motion.span
            className="inline-block"
            animate={selected ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {emoji}
          </motion.span>
        )}
      </span>
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
