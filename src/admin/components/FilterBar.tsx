import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import { CATEGORIES } from '../types';
import type { SortMode } from '../types';

interface FilterBarProps {
  query: string;
  minRating: string;
  maxRating?: string;
  category: string;
  sort: SortMode;
  dateFrom?: string;
  dateTo?: string;
  followUp?: 'all' | 'with';
  onQueryChange: (value: string) => void;
  onMinRatingChange: (value: string) => void;
  onMaxRatingChange?: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: SortMode) => void;
  onDateFromChange?: (value: string) => void;
  onDateToChange?: (value: string) => void;
  onFollowUpChange?: (value: 'all' | 'with') => void;
  onClear: () => void;
}

const SELECT_CLASS =
  'h-12 w-full rounded-xl border border-white/10 bg-surface px-4 text-sm text-ink outline-none transition focus:border-lavender/50 focus:ring-2 focus:ring-lavender/40';
const LABEL_CLASS = 'mb-2 block text-sm font-medium text-ink';
const MICRO_LABEL_CLASS = 'mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted';

export function FilterBar({
  query,
  minRating,
  maxRating,
  category,
  sort,
  dateFrom,
  dateTo,
  followUp,
  onQueryChange,
  onMinRatingChange,
  onMaxRatingChange,
  onCategoryChange,
  onSortChange,
  onDateFromChange,
  onDateToChange,
  onFollowUpChange,
  onClear,
}: FilterBarProps) {
  return (
    <motion.section
      aria-label="Filter responses"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.24 }}
      className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div>
        <label htmlFor="filter-q" className={LABEL_CLASS}>
          Search
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          />
          <input
            id="filter-q"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Text, name or contact"
            autoComplete="off"
            className={`${SELECT_CLASS} pl-10`}
          />
        </div>
      </div>
      <div>
        <label htmlFor="filter-rating" className={LABEL_CLASS}>
          Minimum rating
        </label>
        <select
          id="filter-rating"
          value={minRating}
          onChange={(event) => onMinRatingChange(event.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">Any rating</option>
          <option value="4">4+ stars</option>
          <option value="3">3+ stars</option>
          <option value="2">2+ stars</option>
          <option value="1">1+ star</option>
        </select>
      </div>
      {onMaxRatingChange ? (
        <div>
          <label htmlFor="filter-max-rating" className={LABEL_CLASS}>
            Maximum rating
          </label>
          <select
            id="filter-max-rating"
            value={maxRating ?? ''}
            onChange={(event) => onMaxRatingChange(event.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Any rating</option>
            <option value="2">2 or less</option>
            <option value="1">1 star</option>
          </select>
        </div>
      ) : null}
      <div>
        <label htmlFor="filter-category" className={LABEL_CLASS}>
          Category
        </label>
        <select
          id="filter-category"
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">Any category</option>
          {CATEGORIES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="filter-sort" className={LABEL_CLASS}>
          Sort
        </label>
        <select
          id="filter-sort"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortMode)}
          className={SELECT_CLASS}
        >
          <option value="new">Newest first</option>
          <option value="old">Oldest first</option>
          <option value="high">Highest rating</option>
          <option value="low">Low rating</option>
        </select>
      </div>
      {onDateFromChange ? (
        <div>
          <label htmlFor="filter-from" className={MICRO_LABEL_CLASS}>
            From
          </label>
          <input
            id="filter-from"
            type="date"
            value={dateFrom ?? ''}
            onChange={(event) => onDateFromChange(event.target.value)}
            // Native date pickers follow the input's color scheme on the dark surface.
            className={`${SELECT_CLASS} [color-scheme:dark]`}
          />
        </div>
      ) : null}
      {onDateToChange ? (
        <div>
          <label htmlFor="filter-to" className={MICRO_LABEL_CLASS}>
            To
          </label>
          <input
            id="filter-to"
            type="date"
            value={dateTo ?? ''}
            onChange={(event) => onDateToChange(event.target.value)}
            className={`${SELECT_CLASS} [color-scheme:dark]`}
          />
        </div>
      ) : null}
      {onFollowUpChange ? (
        <div>
          <label htmlFor="filter-follow-up" className={MICRO_LABEL_CLASS}>
            Follow-up
          </label>
          <select
            id="filter-follow-up"
            value={followUp ?? 'all'}
            onChange={(event) => onFollowUpChange(event.target.value as 'all' | 'with')}
            className={SELECT_CLASS}
          >
            <option value="all">All responses</option>
            <option value="with">Follow-up only</option>
          </select>
        </div>
      ) : null}
      <div className="flex items-end">
        <button
          type="button"
          onClick={onClear}
          className="h-12 rounded-xl border border-white/10 px-5 text-sm font-medium text-muted transition hover:border-lavender/40 hover:text-ink focus:outline-none focus:ring-2 focus:ring-lavender/40"
        >
          Clear
        </button>
      </div>
    </motion.section>
  );
}
