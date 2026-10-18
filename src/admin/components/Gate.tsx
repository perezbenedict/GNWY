import { useState } from 'react';
import { motion } from 'motion/react';
import { Emblem } from '../../components/Emblem';

export function Gate({ error, onSubmit }: { error: string; onSubmit: (key: string) => void }) {
  const [value, setValue] = useState('');

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="w-full max-w-md rounded-2xl border border-lavender/15 bg-surface p-6 shadow-2xl shadow-black/50 sm:p-8"
      >
        <div className="flex flex-col items-center text-center">
          <motion.div
            aria-hidden="true"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-5"
          >
            <Emblem className="h-14 w-14" />
          </motion.div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
            Grace Nation Wealthy Youths
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Response Vault</h1>
          <p className="mt-2 text-sm text-muted">Enter your leadership access key</p>

          <form
            className="mt-8 w-full text-left"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit(value);
              setValue('');
            }}
          >
            <label htmlFor="access-key" className="mb-2 block text-sm font-medium text-ink">
              Access key
            </label>
            <input
              id="access-key"
              name="access-key"
              type="password"
              autoComplete="current-password"
              spellCheck={false}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-midnight px-4 text-ink outline-none transition focus:border-lavender/50 focus:ring-2 focus:ring-lavender/40"
            />
            {error ? (
              <p role="alert" className="mt-3 rounded-lg border border-crimson/40 bg-crimson/10 px-3 py-2 text-sm text-ink">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              className="mt-5 h-12 w-full rounded-xl bg-gradient-to-r from-yellow via-lavender to-[#B8862F] text-sm font-semibold uppercase tracking-[0.2em] text-midnight transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-lavender/60 focus:ring-offset-2 focus:ring-offset-surface"
            >
              Unlock
            </button>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
