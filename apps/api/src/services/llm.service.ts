import { z } from "zod";

const promptInterpretationSchema = z.object({
  filters: z.object({
    maxRuntime: z.number().optional(),
    genreBoost: z.array(z.string()).default([]),
    tone: z.array(z.string()).default([])
  }),
  weights: z.object({
    semantic: z.number().min(0).max(1),
    novelty: z.number().min(0).max(1),
    diversity: z.number().min(0).max(1)
  })
});

export type PromptInterpretation = z.infer<typeof promptInterpretationSchema>;

export class LlmService {
  async interpretPrompt(query: string): Promise<PromptInterpretation> {
    // Placeholder for OpenAI Responses API call with structured output.
    // This returns deterministic defaults and can be replaced with live integration.
    const baseline = {
      filters: {
        maxRuntime: query.includes("<40") ? 40 : undefined,
        genreBoost: query.toLowerCase().includes("sci-fi") ? ["science-fiction"] : [],
        tone: query.toLowerCase().includes("ligero") ? ["light"] : []
      },
      weights: {
        semantic: 0.5,
        novelty: 0.3,
        diversity: 0.2
      }
    };

    return promptInterpretationSchema.parse(baseline);
  }

  async explainRecommendation(input: {
    candidateId: string;
    anchors: string[];
    reasons: string[];
  }) {
    return {
      candidateId: input.candidateId,
      explanation: `Recomendada por afinidad con ${input.anchors.join(", ")} y señales: ${input.reasons.join("; ")}.`,
      reasonCodes: input.reasons
    };
  }
}
