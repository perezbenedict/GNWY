export interface Answers {
  rating: 1 | 2 | 3 | 4 | 5 | null;
  stoodOut: string[];
  stoodOutText: string;
  improve: string[];
  improveText: string;
  next: string[];
  nextText: string;
  ideaCustom: string;
  name: string;
  contact: string;
  selectedSuggestion?: string;
  nameIsGenerated?: boolean;
}

export const EMPTY_ANSWERS: Answers = {
  rating: null,
  stoodOut: [],
  stoodOutText: '',
  improve: [],
  improveText: '',
  next: [],
  nextText: '',
  ideaCustom: '',
  name: '',
  contact: '',
};

export interface FeedbackPayload {
  rating: number | null;
  categories: string[];
  liked: string;
  disliked: string;
  suggestions: string;
  expectations: string;
  name: string;
  contact: string;
  nameIsGenerated?: boolean;
}
