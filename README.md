# Trackt Recommendation (PWA)

Plataforma de recomendaciones de cine/series inspirada en Couchmoney, pero con una experiencia más moderna y una arquitectura **híbrida** (determinista + IA asistiva), evitando usar el LLM como “motor mágico” de recomendaciones.

## 1) Principios de producto

- **No clon literal de Couchmoney**: UX propia, feedback fino, taste map visual y búsqueda semántica.
- **LLM como capa de interpretación/explicación**, no como fuente primaria de títulos.
- **Sistema híbrido**:
  1. Candidate generation determinista.
  2. Similaridad semántica (embeddings + pgvector).
  3. Reranking por features + señales de usuario.
  4. LLM para query understanding + explicaciones estructuradas.
- **Trakt-first sync** con snapshot local normalizado e incremental.

---

## 2) Paridad mínima requerida (MVP+)

1. Login con Trakt (OAuth authorization code flow).
2. Importación inicial de:
   - watched history,
   - ratings,
   - watchlist,
   - custom lists,
   - señales de hidden/disliked cuando aplique.
3. Generación de listas personalizadas con filtros:
   - género,
   - año/década,
   - idioma,
   - exclusión de vistos.
4. Autoactualización incremental cuando usuario ve/puntúa algo.
5. Publicación opcional de recomendaciones como listas en Trakt.

---

## 3) Diferenciales obligatorios

### 3.1 Onboarding inteligente (3 entradas)

- Conectar Trakt.
- Elegir 10–20 títulos amados/odiados.
- Quiz corto de gustos (tono, ritmo, intensidad, duración, mainstream/nicho).

### 3.2 Taste map visual

Ejes sugeridos:
- Géneros/subgéneros fuertes.
- Décadas preferidas.
- Idiomas/países.
- Runtime (corto/medio/largo).
- Popularidad (mainstream ↔ nicho).
- Tono (dark, feel-good, cerebral, violento, romántico, etc.).

### 3.3 Búsqueda en lenguaje natural

Ejemplos:
- “Algo como *True Detective* pero menos deprimente”.
- “Anime corto para hoy”.
- “Sci-fi adulta, no infantil, < 2h”.

### 3.4 Explicaciones útiles por recomendación

Cada ítem debe devolver:
- por qué se recomienda,
- qué señales activaron el score,
- títulos ancla del historial,
- en qué se diferencia del resto.

### 3.5 Controles de exploración

- Seguro ↔ arriesgado.
- Popular ↔ escondido.
- Similaridad ↔ exploración.
- Película/serie.
- Duración máxima.

### 3.6 Feedback fino (entrenable)

Además de like/dislike:
- ya la vi,
- no ahora,
- demasiado lenta,
- demasiado mainstream,
- no me gusta este tono,
- quiero más como esto.

---

## 4) Stack propuesto

### Frontend

- Next.js + React + TypeScript.
- Tailwind + Framer Motion.
- Zustand (estado cliente).
- PWA real:
  - `manifest.webmanifest`,
  - service worker,
  - installable,
  - offline shell.

### Backend

- Node.js + NestJS (o Fastify modular).
- PostgreSQL + `pgvector`.
- Redis + BullMQ (sync, embedding, recalculado de perfiles, refresh de listas).
- S3/R2 opcional para caching de assets derivados.

### IA (solo backend)

- OpenAI **Responses API** para:
  - query understanding,
  - extracción de constraints,
  - explicación estructurada.
- Embeddings (`text-embedding-3-small` / `text-embedding-3-large`) para:
  - perfil semántico usuario,
  - similitud título↔título,
  - recuperación semántica.

---

## 5) Arquitectura funcional

## 5.1 Ingesta

Fuentes:
- Trakt: ratings, history, watchlist, lists, activity checkpoints.
- TMDB (u otro): metadata enriquecida.
- Embeddings de títulos (batch jobs).
- Eventos explícitos de feedback del usuario.

## 5.2 Perfilado del usuario

Persistir:
- ratings normalizados,
- afinidad por género/subgénero,
- afinidad por década/año,
- afinidad por idioma/país,
- afinidad por runtime,
- afinidad por tono/mood,
- afinidad por popularidad/nicho,
- centroides semánticos (embeddings positivos/negativos),
- anchors positivos y negativos fuertes.

## 5.3 Candidate generation (paralelo)

Múltiples funnels:
1. Similaridad con títulos favoritos (embedding).
2. Co-ocurrencia/collaborative simple.
3. Similaridad metadata-based (género, elenco, creador, tono, runtime).
4. Señales recientes (session/context aware).
5. Exploración controlada para novedad.

## 5.4 Reranking

Score final recomendado (ejemplo):

`score = w1*affinity + w2*semantic + w3*novelty + w4*diversity + w5*popularity_fit + w6*recency_fit - w7*franchise_fatigue - w8*seen_penalty + w9*session_intent`

Con:
- filtros hard (idioma, tipo, duración, exclusión vistos),
- cuotas mínimas de diversidad,
- calibración por feedback reciente.

## 5.5 Explicación

El LLM recibe únicamente:
- features calculadas,
- anclas del usuario,
- restricciones del prompt,
- metadata del candidato.

Devuelve **JSON estructurado** (`json_schema` / tool calling), no texto libre.

---

## 6) Diseño de datos (sugerencia inicial)

Tablas núcleo:

- `users`
- `auth_trakt_tokens`
- `titles` (movie/show + metadata base)
- `title_embeddings` (`vector`)
- `user_interactions` (watch, rate, hide, feedback_fino)
- `user_profiles` (features agregadas)
- `user_profile_embeddings`
- `recommendation_runs`
- `recommendation_items`
- `sync_state` (cursor/last_activity por usuario y recurso)

Índices clave:
- `ivfflat`/`hnsw` en vectores.
- `(user_id, created_at desc)` en interacciones.
- `(user_id, trakt_last_activity)` en sync.

---

## 7) Integración con Trakt (aislada)

Crear módulo `TraktProvider` con responsabilidades:

- OAuth code flow (authorize + callback + token refresh).
- Métodos tipados:
  - `fetchRatingsIncremental`.
  - `fetchHistoryIncremental`.
  - `fetchWatchlist`.
  - `fetchUserLists`.
  - `fetchLastActivities`.
- Rate limit/backoff y retries idempotentes.
- Normalización a eventos internos (`UserInteractionEvent`).

> Regla: no hardcodear límites/políticas externas; manejar paginación y límites por configuración.

---

## 8) Jobs y sincronización incremental (BullMQ)

Colas sugeridas:
- `trakt.sync.bootstrap`
- `trakt.sync.incremental`
- `embeddings.backfill`
- `profile.recompute`
- `recommendations.refresh`

Flujo incremental:
1. Detectar `last_activity` remoto.
2. Comparar con `sync_state` local.
3. Traer solo cambios desde checkpoint.
4. Persistir eventos normalizados.
5. Recalcular delta de perfil.
6. Refrescar listas activas.

---

## 9) API de producto (contratos iniciales)

- `POST /auth/trakt/start`
- `GET /auth/trakt/callback`
- `POST /onboarding/seed`
- `GET /taste-map`
- `POST /recommendations/query` (prompt natural + filtros)
- `GET /recommendations/lists/:id`
- `POST /feedback`
- `POST /trakt/export-list`

`POST /recommendations/query` (idea de payload):

```json
{
  "query": "algo como Severance pero más ligero y capítulos de <40 min",
  "filters": {
    "type": "show",
    "maxRuntime": 40,
    "excludeSeen": true,
    "language": ["en", "es"]
  },
  "controls": {
    "risk": 0.35,
    "exploration": 0.4,
    "niche": 0.55
  }
}
```

---

## 10) Prompt/LLM policy

- El LLM no propone IDs inventados.
- El LLM solo opera sobre candidatos existentes (`candidate_ids`).
- El LLM responde en JSON validable.
- Fallo de LLM => fallback determinista sin romper UX.

---

## 11) Roadmap de implementación

### Fase 1: Foundation
- Auth Trakt + sync bootstrap.
- Snapshot local + modelos base.
- Candidate generation v1 + rerank heurístico.

### Fase 2: IA útil
- Embeddings títulos + perfil semántico usuario.
- Query understanding con Responses API.
- Explicaciones estructuradas.

### Fase 3: Experiencia diferencial
- Taste map visual.
- Feedback fino completo.
- Controles de exploración avanzados.

### Fase 4: Productización
- Exportación robusta a listas Trakt.
- Observabilidad/AB tests de ranking.
- Métricas online (CTR/save/watch-start/completion).

---

## 12) Métricas de éxito

- Activación onboarding (D0).
- % usuarios con primera lista útil < 2 min.
- CTR por bloque de recomendaciones.
- Save rate / watch-start rate.
- Ocultación/rechazo por motivo.
- Cobertura de catálogo y diversidad intralista.
- Retención D7/D30.

---

## 13) Decisiones no negociables

- OpenAI únicamente desde backend.
- Motor principal de recomendación no-LLM.
- Sincronización incremental, no full refresh continuo.
- Integración Trakt encapsulada en provider.
- Explicaciones generadas con datos trazables y estructurados.

