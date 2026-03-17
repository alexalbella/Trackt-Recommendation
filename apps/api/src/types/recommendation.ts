export type Title = {
  id: string;
  name: string;
  type: "movie" | "show";
  genres: string[];
  year: number;
  language: string;
  runtimeMinutes: number;
  popularity: number;
  embedding: number[];
};

export type UserInteraction = {
  titleId: string;
  action: "watched" | "rated" | "watchlist" | "feedback";
  rating?: number;
  feedback?: "too_slow" | "too_mainstream" | "not_now" | "more_like_this" | "tone_dislike";
  timestamp: string;
};

export type UserProfile = {
  genreAffinity: Record<string, number>;
  decadeAffinity: Record<string, number>;
  languageAffinity: Record<string, number>;
  runtimeAffinity: { min: number; max: number };
  nicheAffinity: number;
  positiveAnchors: string[];
  negativeAnchors: string[];
  embeddingCentroid: number[];
};

export type RecommendationFilters = {
  type?: "movie" | "show";
  excludeSeen?: boolean;
  maxRuntime?: number;
  genres?: string[];
  decades?: number[];
  language?: string[];
};

export type ExplorationControls = {
  risk: number;
  exploration: number;
  niche: number;
};
