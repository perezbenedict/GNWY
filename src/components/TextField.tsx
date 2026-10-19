import { useId } from 'react';
import type { FocusEvent, Ref } from 'react';
import { motion } from 'motion/react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- shared by <input> and <textarea>
type FieldRef = Ref<any>;

interface TextFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  optional?: boolean;
  autoComplete?: string;
  inputType?: string;
  maxLength?: number;
  showCounter?: boolean;
  highlighted?: boolean;
  inputRef?: FieldRef;
}

// motion's whileFocus boxShadow keyframes embed Tailwind's ring vars so the focus ring stays visible through the glow
const GLOW_OFF = 'var(--tw-ring-offset-shadow), var(--tw-ring-shadow), 0px 0px 0px rgba(232,199,122,0)';
const GLOW_ON = 'var(--tw-ring-offset-shadow), var(--tw-ring-shadow), 0px 0px 18px rgba(232,199,122,0.35)';

export function TextField({
  label,
  placeholder,
  value,
  onChange,
  multiline = false,
  optional = false,
  autoComplete,
  inputType = 'text',
  maxLength,
  showCounter = false,
  highlighted = false,
  inputRef,
}: TextFieldProps) {
  const id = useId();
  const base =
    'w-full rounded-2xl border bg-surface px-4 py-3.5 text-base text-ink placeholder:text-muted/70 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-lavender focus:ring-offset-2 focus:ring-offset-midnight';
  const state = highlighted ? 'border-lavender/70 bg-lavender/10' : 'border-lavender/20 focus:border-lavender';

  const handleFocus = (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // keep the field visible above the on-screen keyboard
    event.currentTarget.scrollIntoView?.({ block: 'center' });
  };

  return (
    <div>
      <label htmlFor={id} className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-sm font-medium text-ink">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-muted">optional</span>}
      </label>
      {/* focus emphasis is scale + a gold box-shadow glow; boxShadow keyframes carry the ring vars so the Tailwind ring survives */}
      {multiline ? (
        <motion.textarea
          id={id}
          ref={inputRef}
          className={`${base} ${state} min-h-[110px] resize-y`}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          onFocus={handleFocus}
          onChange={(event) => onChange(event.target.value)}
          style={{ boxShadow: GLOW_OFF }}
          whileFocus={{ scale: 1.02, boxShadow: [GLOW_OFF, GLOW_ON] }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        />
      ) : (
        <motion.input
          id={id}
          ref={inputRef}
          type={inputType}
          autoComplete={autoComplete}
          className={`${base} ${state} min-h-[48px]`}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          onFocus={handleFocus}
          onChange={(event) => onChange(event.target.value)}
          style={{ boxShadow: GLOW_OFF }}
          whileFocus={{ scale: 1.02, boxShadow: [GLOW_OFF, GLOW_ON] }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        />
      )}
      {showCounter && maxLength !== undefined && (
        <p className="mt-1.5 text-right text-xs text-muted" aria-hidden="true">
          {value.length} / {maxLength}
        </p>
      )}
    </div>
  );
}
