import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import { RiotApiError } from "./riot/client.js";
import { isPlatform } from "./riot/regions.js";
import type { ProfileService } from "./services/profile.js";

const paramsSchema = z.object({
  region: z.string().refine(isPlatform, "Unknown region"),
  name: z.string().min(3).max(16),
  tag: z.string().min(2).max(5),
});

export function buildApp(profiles: Pick<ProfileService, "getProfile">): FastifyInstance {
  const app = Fastify({ logger: false });
  void app.register(cors, { origin: true });

  app.get("/api/health", async () => ({ ok: true }));

  app.get("/api/profile/:region/:name/:tag", async (request, reply) => {
    const parsed = paramsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid region, name or tag" });
    }
    const { region, name, tag } = parsed.data;

    try {
      // `region` passed the refine() above, so it is a valid Platform.
      return await profiles.getProfile(region as Parameters<ProfileService["getProfile"]>[0], name, tag);
    } catch (err) {
      if (err instanceof RiotApiError) {
        if (err.status === 404) return reply.code(404).send({ error: "Player not found" });
        if (err.status === 429) return reply.code(429).send({ error: "Riot rate limit hit, try again shortly" });
        if (err.status === 401 || err.status === 403) {
          return reply.code(502).send({ error: "Riot API key is invalid or expired" });
        }
        return reply.code(502).send({ error: "Riot API error" });
      }
      throw err;
    }
  });

  return app;
}
