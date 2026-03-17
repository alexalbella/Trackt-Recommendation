import Fastify from "fastify";
import { recommendationRoutes } from "./routes/recommendations.route.js";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ ok: true }));
app.register(recommendationRoutes);

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT ?? 4000), host: "0.0.0.0" });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
