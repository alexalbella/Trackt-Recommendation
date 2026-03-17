import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null
});

export const queues = {
  traktSyncBootstrap: new Queue("trakt.sync.bootstrap", { connection }),
  traktSyncIncremental: new Queue("trakt.sync.incremental", { connection }),
  profileRecompute: new Queue("profile.recompute", { connection }),
  recommendationsRefresh: new Queue("recommendations.refresh", { connection })
};
