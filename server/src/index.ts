import { buildApp } from "./app.js";
import { MemoryCache } from "./cache.js";
import { RiotClient } from "./riot/client.js";
import { DEV_KEY_LIMITS, RateLimiter } from "./riot/rateLimiter.js";
import { ProfileService } from "./services/profile.js";

/* Load server/.env if it exists (works the same on Windows, macOS and Linux).
   Variables already set in the shell take precedence over the file. */
try {
  process.loadEnvFile(new URL("../.env", import.meta.url));
} catch {
  // if no .env file: fall-back to real environment variables
}

const apiKey = process.env.RIOT_API_KEY?.trim();
if (!apiKey) {
  console.error("Missing RIOT_API_KEY.");
  console.error("1. Get a development key at https://developer.riotgames.com");
  console.error("2. Copy server/.env.example to server/.env and paste the key after RIOT_API_KEY=");
  process.exit(1);
}

const riot = new RiotClient({ apiKey, limiter: new RateLimiter({ limits: DEV_KEY_LIMITS }) });
const app = buildApp(new ProfileService(riot, new MemoryCache()));

const port = Number(process.env.PORT ?? 3001);
await app.listen({ port, host: "0.0.0.0" });
console.log(`API listening on http://localhost:${port}`);
