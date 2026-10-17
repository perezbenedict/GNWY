import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Progress } from './Progress';

interface ScreenShellProps {
  heading: string;
  question?: string;
  support: string;
  progress?: { step: number; total: number };
  children: ReactNode;
}

export function ScreenShell({ heading, question, support, progress, children }: ScreenShellProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section className="pb-4">
      {progress && <Progress step={progress.step} total={progress.total} />}
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-3xl font-bold leading-tight text-ink focus:outline-none sm:text-4xl"
      >
        {heading}
      </h1>
      {question && (
        <h2 className="mt-4 bg-gradient-to-br from-[#F5DFA6] via-[#E8C77A] to-[#B8862F] bg-clip-text font-display text-2xl font-semibold text-transparent sm:text-3xl">{question}</h2>
      )}
      <p className="mt-3 text-base leading-relaxed text-muted">{support}</p>
      <div className="mt-8">{children}</div>
    </section>
  );
}
