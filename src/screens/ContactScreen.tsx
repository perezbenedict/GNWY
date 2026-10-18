import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { NavButtons } from '../components/NavButtons';
import { ScreenShell } from '../components/ScreenShell';
import { TextField } from '../components/TextField';
import { fetchUsedNicknames } from '../api/nicknames';
import { NICKNAMES } from '../data/nicknames';
import { pickSuggestion } from '../lib/nicknames';

interface ContactScreenProps {
  name: string;
  contact: string;
  onNameChange: (value: string) => void;
  onContactChange: (value: string) => void;
  /** Use-button placement: sets the name plus nameIsGenerated/selectedSuggestion. */
  onNameGenerated?: (value: string) => void;
  /** Manual edit detected: clear the nameIsGenerated flag. */
  onNameEdited?: () => void;
  onBack: () => void;
  onNext: () => void;
}

export function ContactScreen({
  name,
  contact,
  onNameChange,
  onContactChange,
  onNameGenerated,
  onNameEdited,
  onBack,
  onNext,
}: ContactScreenProps) {
  const [suggestion, setSuggestion] = useState<string | null>(() => pickSuggestion(NICKNAMES, null, new Set()));
  const [usedSet, setUsedSet] = useState<ReadonlySet<string>>(() => new Set());
  // Exact string last placed by the Use button; anything else counts as a manual edit.
  const lastFilledRef = useRef<string | null>(null);

  useEffect(() => {
    // Keep tests hermetic: never fetch in vitest/jsdom.
    if (import.meta.env.MODE === 'test') return;
    let cancelled = false;
    fetchUsedNicknames().then((used) => {
      if (cancelled) return;
      setUsedSet(used);
      setSuggestion((current) =>
        current === null || used.has(current) ? pickSuggestion(NICKNAMES, lastFilledRef.current, used) : current
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const useDisabled = name !== '' && name !== suggestion;

  const handleNameInput = (value: string) => {
    onNameChange(value);
    if (value !== lastFilledRef.current) onNameEdited?.();
  };

  const handleAnother = () => {
    setSuggestion(pickSuggestion(NICKNAMES, suggestion, usedSet));
  };

  const handleUse = () => {
    if (useDisabled || suggestion === null) return;
    let chosen = suggestion;
    if (usedSet.has(suggestion)) {
      // Claimed under our feet (e.g. restored draft): swap in a fresh one.
      const fresh = pickSuggestion(NICKNAMES, suggestion, usedSet);
      if (!fresh) return;
      setSuggestion(fresh);
      chosen = fresh;
    }
    lastFilledRef.current = chosen;
    onNameChange(chosen);
    onNameGenerated?.(chosen);
  };

  return (
    <>
      <ScreenShell
        heading={'One last thing… \u{1F44B}'}
        question="Want us to follow up with you?"
        support="Totally optional. Leave your details only if you want us to reach out."
        progress={{ step: 5, total: 5 }}
      >
        <div className="flex flex-col gap-5">
          <div>
            <TextField
              label="Name"
              placeholder={suggestion ?? ''}
              value={name}
              onChange={handleNameInput}
              optional
              autoComplete="name"
            />
            <AnimatePresence mode="wait">
              <motion.span
                key={suggestion ?? 'none'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="mt-2 block font-display italic text-lavender"
              >
                {suggestion ?? ''}
              </motion.span>
            </AnimatePresence>
            <p className="mt-1 text-sm text-muted">Your government name is not compulsory. 😂</p>
            {suggestion === null ? (
              <p className="mt-3 text-sm text-muted">Every nickname's been claimed - write your own ✨</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                <motion.button
                  type="button"
                  onClick={handleAnother}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="min-h-[44px] rounded-xl border border-lavender/40 px-4 text-sm font-medium text-lavender transition-colors hover:bg-lavender/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender/60"
                >
                  🎲 Give me another
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleUse}
                  aria-disabled={useDisabled}
                  initial={{ opacity: 0, y: 8 }}
                  // Mirror the class-based disabled opacity; motion's inline opacity would otherwise override it.
                  animate={{ opacity: useDisabled ? 0.5 : 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut', delay: 0.06 }}
                  className={`min-h-[44px] rounded-xl bg-gradient-to-b from-lavender to-[#d4b065] px-4 text-sm font-semibold text-midnight transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender/60 ${
                    useDisabled ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  Use this nickname
                </motion.button>
              </div>
            )}
          </div>
          <TextField
            label="Email or WhatsApp"
            placeholder="Your email or WhatsApp number"
            value={contact}
            onChange={onContactChange}
            optional
            autoComplete="tel"
          />
        </div>
      </ScreenShell>
      <NavButtons onBack={onBack} onNext={onNext} />
    </>
  );
}
