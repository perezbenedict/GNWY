export interface FeedbackItem {
  id: string;
  created_at: string;
  rating: number | null;
  categories: string;
  liked: string;
  disliked: string;
  suggestions: string;
  expectations: string;
  name: string;
  contact: string;
}

export interface Summary {
  total: number;
  averageRating: number | null;
  todayCount: number;
  categoryCounts: Record<string, number>;
}

export type SortMode = 'new' | 'old' | 'high' | 'low';

export const CATEGORIES = [
  'Worship',
  'The Word',
  'Production & Sound',
  'Welcome & Hospitality',
  'Youth Activities',
  'Logistics & Venue',
  'Other',
] as const;
