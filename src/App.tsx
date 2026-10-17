import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { useAnswers } from './state/useAnswers';
import { buildPayload, payloadHasContent, submitFeedback } from './api/submit';
import { Intro } from './screens/Intro';
import { RatingScreen } from './screens/RatingScreen';
import { StoodOutScreen } from './screens/StoodOutScreen';
import { ImproveScreen, NOTHING_OPTION } from './screens/ImproveScreen';
import { NextScreen } from './screens/NextScreen';
import { ContactScreen } from './screens/ContactScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { SuccessScreen } from './screens/SuccessScreen';

const forwardVariants: Variants = {
  enter: { opacity: 0, x: 28 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -28 },
};

const backwardVariants: Variants = {
  enter: { opacity: 0, x: -28 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 28 },
};

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
    try {
      await submitFeedback(payload);
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
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={screenKey}
          className="min-w-0"
          variants={direction > 0 ? forwardVariants : backwardVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.7 }}
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
