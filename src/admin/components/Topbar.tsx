import { motion } from 'motion/react';
import { Lock } from 'lucide-react';
import { Emblem } from '../../components/Emblem';

export function Topbar({ onLock }: { onLock: () => void }) {
  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-20 border-b border-white/10 bg-surface/80 backdrop-blur"
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="gnwy-logo-spin h-8 w-8 shrink-0">
            <Emblem className="h-full w-full" />
          </div>
          <h1 className="min-w-0 truncate text-sm font-medium text-muted sm:text-base">
            <span className="font-display text-base font-semibold text-ink sm:text-lg">
              Grace Nation Wealthy Youths
            </span>{' '}
            — Response Vault
          </h1>
        </div>
        <button
          type="button"
          onClick={onLock}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-medium text-muted transition hover:border-lavender/40 hover:text-ink focus:outline-none focus:ring-2 focus:ring-lavender/40"
        >
          <Lock className="h-4 w-4" aria-hidden="true" />
          Lock
        </button>
      </div>
    </motion.header>
  );
}
