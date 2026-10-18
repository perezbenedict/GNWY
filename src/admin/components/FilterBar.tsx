import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import { CATEGORIES } from '../types';
import type { SortMode } from '../types';

interface FilterBarProps {
  query: string;
  minRating: string;
  category: string;
  sort: SortMode;
  onQueryChange: (value: string) => void;
  onMinRatingChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: SortMode) => void;
  onClear: () => void;
}

const SELECT_CLASS =
  'h-12 w-full rounded-xl border border-white/10 bg-surface px-4 text-sm text-ink outline-none transition focus:border-lavender/50 focus:ring-2 focus:ring-lavender/40';
const LABEL_CLASS = 'mb-2 block text-sm font-medium text-ink';

export function FilterBar({
  query,
  minRating,
  category,
  sort,
  onQueryChange,
  onMinRatingChange,
  onCategoryChange,
  onSortChange,
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
