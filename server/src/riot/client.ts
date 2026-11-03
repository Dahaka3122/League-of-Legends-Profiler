import { z } from "zod";
import { RateLimiter } from "./rateLimiter.js";
import {
  Platform,
  platformUrl,
  RegionalHost,
  regionalHostFor,
  regionalUrl,
} from "./regions.js";
import {
  accountSchema,
  leagueEntrySchema,
  masterySchema,
  matchSchema,
  summonerSchema,
  type RiotAccount,
  type RiotLeagueEntry,
  type RiotMastery,
  type RiotMatch,
  type RiotSummoner,
} from "./types.js";

export class RiotApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "RiotApiError";
  }
}

export interface RiotClientOptions {
  apiKey: string;
  limiter: RateLimiter;
  /** Injectable for tests; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
  /** How many times to retry after a 429. */
  maxRetries?: number;
}

export class RiotClient {
  private readonly apiKey: string;
  private readonly limiter: RateLimiter;
  private readonly fetchImpl: typeof fetch;
  private readonly maxRetries: number;

  constructor(options: RiotClientOptions) {
    this.apiKey = options.apiKey;
    this.limiter = options.limiter;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.maxRetries = options.maxRetries ?? 1;
  }

  /** Looks up an account by Riot ID (Name#TAG). Uses the regional host. */
  getAccountByRiotId(platform: Platform, gameName: string, tagLine: string): Promise<RiotAccount> {
    const base = regionalUrl(regionalHostFor(platform));
    const path = `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    return this.request(base + path, accountSchema);
  }

  getSummonerByPuuid(platform: Platform, puuid: string): Promise<RiotSummoner> {
    const path = `/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;
    return this.request(platformUrl(platform) + path, summonerSchema);
  }

  getRankedEntries(platform: Platform, puuid: string): Promise<RiotLeagueEntry[]> {
    const path = `/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`;
    return this.request(platformUrl(platform) + path, z.array(leagueEntrySchema));
  }

  getTopMastery(platform: Platform, puuid: string, count = 3): Promise<RiotMastery[]> {
    const path = `/lol/champion-mastery/v4/champion-masteries/by-puuid/${encodeURIComponent(puuid)}/top?count=${count}`;
    return this.request(platformUrl(platform) + path, z.array(masterySchema));
  }

  getMatchIds(host: RegionalHost, puuid: string, count = 10): Promise<string[]> {
    const path = `/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=${count}`;
    return this.request(regionalUrl(host) + path, z.array(z.string()));
  }

  getMatch(host: RegionalHost, matchId: string): Promise<RiotMatch> {
    const path = `/lol/match/v5/matches/${encodeURIComponent(matchId)}`;
    return this.request(regionalUrl(host) + path, matchSchema);
  }

  private async request<S extends z.ZodTypeAny>(url: string, schema: S): Promise<z.infer<S>> {
    for (let attempt = 0; ; attempt++) {
      await this.limiter.acquire();
      const res = await this.fetchImpl(url, { headers: { "X-Riot-Token": this.apiKey } });

      if (res.status === 429 && attempt < this.maxRetries) {
        const retryAfterSec = Number(res.headers.get("Retry-After") ?? "1");
        this.limiter.blockFor((Number.isFinite(retryAfterSec) ? retryAfterSec : 1) * 1000);
        continue;
      }
      if (!res.ok) {
        throw new RiotApiError(res.status, `Riot API responded ${res.status}`);
      }

      const parsed = schema.safeParse(await res.json());
      if (!parsed.success) {
        throw new RiotApiError(502, `Unexpected response shape from Riot: ${parsed.error.message}`);
      }
      return parsed.data;
    }
  }
}
