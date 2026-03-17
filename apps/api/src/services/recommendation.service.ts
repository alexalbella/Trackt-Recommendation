import {
  ExplorationControls,
  RecommendationFilters,
  Title,
  UserInteraction,
  UserProfile
} from "../types/recommendation.js";
import { LlmService } from "./llm.service.js";

type RankedCandidate = {
  title: Title;
  score: number;
  reasons: string[];
};

export class RecommendationService {
  constructor(private readonly llmService: LlmService) {}

  ingest(interactions: UserInteraction[]) {
    return interactions.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  }

  profile(interactions: UserInteraction[], catalog: Title[]): UserProfile {
    const watched = interactions.filter((i) => i.action === "watched" || i.action === "rated");
    const profile: UserProfile = {
      genreAffinity: {},
      decadeAffinity: {},
      languageAffinity: {},
      runtimeAffinity: { min: 0, max: 300 },
      nicheAffinity: 0.5,
      positiveAnchors: [],
      negativeAnchors: [],
      embeddingCentroid: Array(8).fill(0)
    };

    let counted = 0;
    for (const interaction of watched) {
      const title = catalog.find((c) => c.id === interaction.titleId);
      if (!title) continue;
      counted += 1;
      for (const g of title.genres) profile.genreAffinity[g] = (profile.genreAffinity[g] ?? 0) + 1;
      const decade = Math.floor(title.year / 10) * 10;
      profile.decadeAffinity[String(decade)] = (profile.decadeAffinity[String(decade)] ?? 0) + 1;
      profile.languageAffinity[title.language] = (profile.languageAffinity[title.language] ?? 0) + 1;
      if ((interaction.rating ?? 0) >= 8) profile.positiveAnchors.push(title.name);
      if ((interaction.rating ?? 10) <= 4) profile.negativeAnchors.push(title.name);
      profile.embeddingCentroid = profile.embeddingCentroid.map((value, idx) => value + (title.embedding[idx] ?? 0));
    }

    if (counted > 0) {
      profile.embeddingCentroid = profile.embeddingCentroid.map((value) => value / counted);
    }

    return profile;
  }

  generateCandidates(catalog: Title[], filters: RecommendationFilters, seenIds: Set<string>) {
    return catalog.filter((title) => {
      if (filters.type && title.type !== filters.type) return false;
      if (filters.excludeSeen && seenIds.has(title.id)) return false;
      if (filters.maxRuntime && title.runtimeMinutes > filters.maxRuntime) return false;
      if (filters.language?.length && !filters.language.includes(title.language)) return false;
      if (filters.genres?.length && !title.genres.some((genre) => filters.genres?.includes(genre))) return false;
      return true;
    });
  }

  rerank(
    candidates: Title[],
    profile: UserProfile,
    controls: ExplorationControls,
    semanticWeight: number
  ): RankedCandidate[] {
    return candidates
      .map((title) => {
        const genreScore = title.genres.reduce((sum, genre) => sum + (profile.genreAffinity[genre] ?? 0), 0);
        const semanticScore = cosine(profile.embeddingCentroid, title.embedding);
        const nicheFit = (controls.niche / 100) * (1 - title.popularity);
        const explorationBoost = controls.exploration / 100;
        const score = genreScore * 0.4 + semanticScore * semanticWeight + nicheFit * 0.2 + explorationBoost * 0.1;

        return {
          title,
          score,
          reasons: [
            `genre_match:${genreScore.toFixed(2)}`,
            `semantic:${semanticScore.toFixed(2)}`,
            `niche_fit:${nicheFit.toFixed(2)}`
          ]
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  async recommend(input: {
    query: string;
    catalog: Title[];
    interactions: UserInteraction[];
    filters: RecommendationFilters;
    controls: ExplorationControls;
  }) {
    const ingestion = this.ingest(input.interactions);
    const profile = this.profile(ingestion, input.catalog);
    const seenIds = new Set(input.interactions.filter((i) => i.action === "watched").map((i) => i.titleId));
    const promptInterpretation = await this.llmService.interpretPrompt(input.query);

    const mergedFilters: RecommendationFilters = {
      ...input.filters,
      maxRuntime: input.filters.maxRuntime ?? promptInterpretation.filters.maxRuntime,
      genres: [...(input.filters.genres ?? []), ...promptInterpretation.filters.genreBoost]
    };

    const candidates = this.generateCandidates(input.catalog, mergedFilters, seenIds);
    const ranked = this.rerank(candidates, profile, input.controls, promptInterpretation.weights.semantic);

    // Grounding rule: explanations only over ranked candidate IDs, never allowing LLM to inject new IDs.
    return Promise.all(
      ranked.slice(0, 20).map(async (candidate) => ({
        id: candidate.title.id,
        title: candidate.title.name,
        score: Number(candidate.score.toFixed(4)),
        explanation: await this.llmService.explainRecommendation({
          candidateId: candidate.title.id,
          anchors: profile.positiveAnchors.slice(0, 3),
          reasons: candidate.reasons
        })
      }))
    );
  }
}

function cosine(a: number[], b: number[]) {
  const dot = a.reduce((sum, current, idx) => sum + current * (b[idx] ?? 0), 0);
  const magA = Math.sqrt(a.reduce((sum, current) => sum + current * current, 0));
  const magB = Math.sqrt(b.reduce((sum, current) => sum + current * current, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}
