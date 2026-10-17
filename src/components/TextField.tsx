import { useId } from 'react';
import type { FocusEvent, Ref } from 'react';

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
      {multiline ? (
        <textarea
          id={id}
          ref={inputRef}
          className={`${base} ${state} min-h-[110px] resize-y`}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          onFocus={handleFocus}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
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
