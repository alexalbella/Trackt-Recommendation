import { FastifyInstance } from "fastify";
import { z } from "zod";
import { LlmService } from "../services/llm.service.js";
import { RecommendationService } from "../services/recommendation.service.js";

const payloadSchema = z.object({
  query: z.string().min(1),
  filters: z
    .object({
      type: z.enum(["movie", "show"]).optional(),
      excludeSeen: z.boolean().default(true),
      maxRuntime: z.number().optional(),
      genres: z.array(z.string()).optional(),
      language: z.array(z.string()).optional()
    })
    .default({ excludeSeen: true }),
  controls: z.object({
    risk: z.number().min(0).max(100),
    exploration: z.number().min(0).max(100),
    niche: z.number().min(0).max(100)
  })
});

const mockCatalog = [
  {
    id: "show-1",
    name: "Patriot",
    type: "show" as const,
    genres: ["drama", "comedy"],
    year: 2015,
    language: "en",
    runtimeMinutes: 42,
    popularity: 0.3,
    embedding: [0.2, 0.6, 0.1, 0.4, 0.4, 0.5, 0.2, 0.3]
  },
  {
    id: "show-2",
    name: "Counterpart",
    type: "show" as const,
    genres: ["science-fiction", "thriller"],
    year: 2017,
    language: "en",
    runtimeMinutes: 56,
    popularity: 0.4,
    embedding: [0.3, 0.8, 0.4, 0.1, 0.5, 0.6, 0.7, 0.2]
  },
  {
    id: "show-3",
    name: "The Bear",
    type: "show" as const,
    genres: ["drama"],
    year: 2022,
    language: "en",
    runtimeMinutes: 33,
    popularity: 0.65,
    embedding: [0.4, 0.3, 0.6, 0.4, 0.2, 0.5, 0.2, 0.7]
  }
];

const mockInteractions = [
  { titleId: "show-2", action: "rated" as const, rating: 9, timestamp: new Date().toISOString() }
];

export async function recommendationRoutes(app: FastifyInstance) {
  const service = new RecommendationService(new LlmService());

  app.post("/recommendations/query", async (request, reply) => {
    const payload = payloadSchema.parse(request.body);
    const recommendations = await service.recommend({
      query: payload.query,
      catalog: mockCatalog,
      interactions: mockInteractions,
      filters: payload.filters,
      controls: payload.controls
    });

    return reply.send({
      source: "hybrid-engine",
      grounded: true,
      recommendations
    });
  });
}
