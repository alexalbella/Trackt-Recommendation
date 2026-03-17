# Trackt Recommendation

PWA mobile-first para recomendaciones de cine/series inspirada en Couchmoney, pero con motor híbrido avanzado:

1. **Ingesta** (Trakt + metadata).
2. **Perfilado** (afinidades + embeddings de gusto).
3. **Candidate generation** (determinista y paralelo).
4. **Reranking** (features + controles + contexto).

> El LLM no recomienda desde cero: solo interpreta prompts, produce filtros/weights estructurados y explica resultados ya grounded en candidatos.

## Monorepo

- `apps/web`: Next.js + React + TypeScript + Tailwind + Zustand + Framer Motion + PWA shell.
- `apps/api`: Node + Fastify + Zod + BullMQ/Redis hooks + pipeline híbrido.

## Features implementadas en esta base

### Frontend (PWA)
- UI mobile-first con:
  - controles de exploración (`riesgo`, `nicho`, `exploración`),
  - cards con explicaciones.
- Registro de service worker.
- `manifest.webmanifest` e instalación básica.
- Iconos de PWA en formato SVG (sin binarios en el repo).
- Preparado para onboarding inteligente, taste map y búsqueda natural.

### Backend (motor híbrido)
- Endpoint `POST /recommendations/query`.
- Pipeline de 4 capas en `RecommendationService`:
  - `ingest()`
  - `profile()`
  - `generateCandidates()`
  - `rerank()`
- Uso de embeddings para score semántico (`cosine`).
- `LlmService` con salida estructurada (Zod) para:
  - interpretación de prompt,
  - explicación estructurada por item.
- Garantía de grounding: el LLM solo explica IDs candidatos del motor.

### Trakt + Jobs
- `TraktProvider` aislado para OAuth URL + sync incremental.
- Colas BullMQ definidas para:
  - `trakt.sync.bootstrap`
  - `trakt.sync.incremental`
  - `profile.recompute`
  - `recommendations.refresh`

## Próximos pasos

1. Persistencia real en PostgreSQL + `pgvector`.
2. OAuth callback real con token refresh de Trakt.
3. Workers BullMQ para sync incremental + recomputación de perfil.
4. Integración OpenAI Responses API en backend (tool/function calling + json_schema).
5. Export opcional de listas a Trakt.
6. Observabilidad y experimentación de ranking (A/B).
