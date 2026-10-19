import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { useAnswers } from './state/useAnswers';
import { buildPayload, payloadHasContent, submitFeedback } from './api/submit';
import { fetchUsedNicknames } from './api/nicknames';
import { NICKNAMES } from './data/nicknames';
import { pickSuggestion } from './lib/nicknames';
import { Intro } from './screens/Intro';
import { RatingScreen } from './screens/RatingScreen';
import { StoodOutScreen } from './screens/StoodOutScreen';
import { ImproveScreen, NOTHING_OPTION } from './screens/ImproveScreen';
import { NextScreen } from './screens/NextScreen';
import { ContactScreen } from './screens/ContactScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { SuccessScreen } from './screens/SuccessScreen';
import { Emblem } from './components/Emblem';

const forwardVariants: Variants = {
  enter: { opacity: 0, x: 72, y: 10, scale: 0.955 },
  center: { opacity: 1, x: 0, y: 0, scale: 1 },
  exit: { opacity: 0, x: -72, y: -8, scale: 0.955 },
};

// Backward mirrors x only; y keeps the up-out / down-in page-turn diagonal.
const backwardVariants: Variants = {
  enter: { opacity: 0, x: -72, y: 10, scale: 0.955 },
  center: { opacity: 1, x: 0, y: 0, scale: 1 },
  exit: { opacity: 0, x: 72, y: -8, scale: 0.955 },
};

// Soft glow blobs rearrange per step; x/y deltas keep motion transform-only (safe under reduced motion).
const BLOB_DELTAS = {
  A: { a: { x: 0, y: 0 }, b: { x: 0, y: 0 } },
  B: { a: { x: 150, y: 120 }, b: { x: -240, y: -140 } },
  C: { a: { x: -40, y: 260 }, b: { x: 60, y: -60 } },
} as const;

const blobTransition = { type: 'spring', stiffness: 120, damping: 22 } as const;

type AtmosphereState = keyof typeof BLOB_DELTAS;

const STEP_ATMOSPHERE: Record<number, AtmosphereState> = {
  0: 'A',
  1: 'A',
  2: 'B',
  3: 'B',
  4: 'C',
  5: 'C',
  6: 'B',
};

// Living gold emblem behind every screen; transforms are skipped under reduced motion.
function BackgroundEmblem({ atmosphere }: { atmosphere: AtmosphereState }) {
  const deltas = BLOB_DELTAS[atmosphere];
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 flex items-center justify-center">
      <div
        className="absolute h-[80vmin] w-[80vmin] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(232,199,122,0.10), transparent 65%)' }}
      />
      {/* Radial gradients, not blur filters: a filtered square div can paint its box over the
          emblem (radius dropped / filter clipped to element bounds) in some engines. */}
      <motion.div
        className="absolute h-72 w-72 rounded-full"
        style={{
          top: -96,
          left: -96,
          background: 'radial-gradient(circle, rgba(179,34,58,0.10) 40%, rgba(179,34,58,0) 65%)',
        }}
        animate={deltas.a}
        transition={blobTransition}
      />
      <motion.div
        className="absolute h-64 w-64 rounded-full"
        style={{
          top: 160,
          right: -80,
          background: 'radial-gradient(circle, rgba(232,199,122,0.15) 40%, rgba(232,199,122,0) 65%)',
        }}
        animate={deltas.b}
        transition={blobTransition}
      />
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 140, repeat: Infinity, ease: 'linear' }}>
        <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}>
          <Emblem className="h-[62vmin] w-[62vmin] max-h-[520px] max-w-[520px] opacity-[0.05]" />
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const { answers, step, setAnswer, goTo, clearDraft, reset } = useAnswers();
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const screenKey = submitStatus === 'success' ? 'success' : String(step);

  const prevStep = useRef(step);
  // Step does not decrease when success renders, so treat success as forward.
  const direction = submitStatus === 'success' || step >= prevStep.current ? 1 : -1;

  useEffect(() => {
    prevStep.current = step;
  }, [step]);

  const toggleIn = (list: string[], label: string) =>
    list.includes(label) ? list.filter((item) => item !== label) : [...list, label];

  // "Nothing comes to mind" is exclusive with every other improve option.
  const toggleImprove = (label: string) => {
    const current = answers.improve;
    if (label === NOTHING_OPTION) {
      setAnswer({ improve: current.includes(label) ? [] : [label] });
    } else {
      setAnswer({ improve: toggleIn(current.filter((item) => item !== NOTHING_OPTION), label) });
    }
  };

  const handleSubmit = async () => {
    if (submitStatus === 'submitting') return;
    const payload = buildPayload(answers);
    if (!payloadHasContent(payload)) {
      setError('Pick a rating or share at least one thought to send.');
      return;
    }
    setError('');
    setSubmitStatus('submitting');
    let current = answers;
    try {
      try {
        await submitFeedback(payload);
      } catch (err) {
        // Duck-typed (not NicknameTakenError) so the vi.mock in App.test.tsx keeps working.
        const status = (err as { status?: number } | null)?.status;
        if (status !== 409 || current.nameIsGenerated !== true || !current.name.trim()) throw err;
        const freshUsed = await fetchUsedNicknames();
        const next = pickSuggestion(NICKNAMES, current.name.trim(), freshUsed);
        if (!next) throw err;
        current = { ...current, name: next, nameIsGenerated: true, selectedSuggestion: next };
        setAnswer({ name: next, nameIsGenerated: true, selectedSuggestion: next });
        // Single retry; any further failure falls through to the existing error handling.
        await submitFeedback(buildPayload(current));
      }
      clearDraft();
      setSubmitStatus('success');
    } catch {
      setError('Something went wrong. Check your connection and try again.');
      setSubmitStatus('error');
    }
  };

  if (submitStatus === 'success') {
    return (
      <main
        className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col justify-center overflow-x-clip px-4 pb-12 pt-10 sm:px-8"
        style={{ paddingBottom: 'max(3rem, env(safe-area-inset-bottom))' }}
      >
        <BackgroundEmblem atmosphere="A" />
        <SuccessScreen
          onDone={() => {
            setSubmitStatus('idle');
            goTo(0);
          }}
          onSendAnother={() => {
            reset();
            setError('');
            setSubmitStatus('idle');
          }}
        />
      </main>
    );
  }

  let screen: ReactNode;
  switch (step) {
    case 1:
      screen = (
        <RatingScreen
          rating={answers.rating}
          onSelect={(value) => setAnswer({ rating: value })}
          onBack={() => goTo(0)}
          onNext={() => goTo(2)}
        />
      );
      break;
    case 2:
      screen = (
        <StoodOutScreen
          selected={answers.stoodOut}
          text={answers.stoodOutText}
          onToggle={(label) => setAnswer({ stoodOut: toggleIn(answers.stoodOut, label) })}
          onTextChange={(value) => setAnswer({ stoodOutText: value })}
          onBack={() => goTo(1)}
          onNext={() => goTo(3)}
          onSkip={() => goTo(3)}
        />
      );
      break;
    case 3:
      screen = (
        <ImproveScreen
          selected={answers.improve}
          text={answers.improveText}
          onToggle={toggleImprove}
          onTextChange={(value) => setAnswer({ improveText: value })}
          onBack={() => goTo(2)}
          onNext={() => goTo(4)}
          onSkip={() => goTo(4)}
        />
      );
      break;
    case 4:
      screen = (
        <NextScreen
          selected={answers.next}
          ideaCustom={answers.ideaCustom}
          onToggle={(label) => setAnswer({ next: toggleIn(answers.next, label) })}
          onIdeaCustomChange={(value) => setAnswer({ ideaCustom: value })}
          onBack={() => goTo(3)}
          onNext={() => goTo(5)}
          onSkip={() => goTo(5)}
        />
      );
      break;
    case 5:
      screen = (
        <ContactScreen
          name={answers.name}
          contact={answers.contact}
          onNameChange={(value) => setAnswer({ name: value })}
          onContactChange={(value) => setAnswer({ contact: value })}
          onNameGenerated={(value) => setAnswer({ name: value, nameIsGenerated: true, selectedSuggestion: value })}
          onNameEdited={() => setAnswer({ nameIsGenerated: false })}
          onBack={() => goTo(4)}
          onNext={() => goTo(6)}
        />
      );
      break;
    case 6:
      screen = (
        <ReviewScreen
          answers={answers}
          submitting={submitStatus === 'submitting'}
          submitFailed={submitStatus === 'error'}
          error={error}
          onSubmit={handleSubmit}
          onEdit={(target) => goTo(target)}
          onBack={() => goTo(5)}
        />
      );
      break;
    default:
      screen = <Intro onStart={() => goTo(1)} />;
  }

  return (
    <main
      className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col justify-center overflow-x-clip px-4 pb-12 pt-10 sm:px-8"
      style={{ paddingBottom: 'max(3rem, env(safe-area-inset-bottom))' }}
    >
      <BackgroundEmblem atmosphere={STEP_ATMOSPHERE[step] ?? 'A'} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={screenKey}
          className="min-w-0"
          variants={direction > 0 ? forwardVariants : backwardVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          {screen}
        </motion.div>
      </AnimatePresence>
      <p className="sr-only" aria-live="polite">
        {submitStatus === 'submitting' ? 'Sending your feedback…' : ''}
      </p>
    </main>
  );
}
