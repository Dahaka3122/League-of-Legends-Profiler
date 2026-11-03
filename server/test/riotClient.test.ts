import { describe, expect, it, vi } from "vitest";
import { RiotApiError, RiotClient } from "../src/riot/client.js";
import { RateLimiter } from "../src/riot/rateLimiter.js";
import { fakeClock, jsonResponse } from "./helpers.js";

function setup(responses: Response[], maxRetries?: number) {
  const clock = fakeClock();
  const limiter = new RateLimiter({ limits: [{ max: 1000, windowMs: 1000 }], ...clock });
  const fetchImpl = vi.fn();
  for (const r of responses) fetchImpl.mockResolvedValueOnce(r);
  const client = new RiotClient({
    apiKey: "RGAPI-test",
    limiter,
    fetchImpl: fetchImpl as unknown as typeof fetch,
    ...(maxRetries !== undefined ? { maxRetries } : {}),
  });
  return { client, fetchImpl, clock };
}

describe("RiotClient", () => {
  it("looks up accounts on the regional host with the API key header", async () => {
    const { client, fetchImpl } = setup([jsonResponse({ puuid: "p1", gameName: "Faker", tagLine: "KR1" })]);

    const account = await client.getAccountByRiotId("euw1", "Faker", "KR1");

    expect(account).toEqual({ puuid: "p1", gameName: "Faker", tagLine: "KR1" });
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/Faker/KR1");
    expect((init.headers as Record<string, string>)["X-Riot-Token"]).toBe("RGAPI-test");
  });

  it("URL-encodes names with spaces and special characters", async () => {
    const { client, fetchImpl } = setup([jsonResponse({ puuid: "p1", gameName: "Hide on bush", tagLine: "KR1" })]);

    await client.getAccountByRiotId("kr", "Hide on bush", "KR1");

    const [url] = fetchImpl.mock.calls[0] as [string];
    expect(url).toContain("/Hide%20on%20bush/KR1");
  });

  it("uses the platform host for summoner data", async () => {
    const { client, fetchImpl } = setup([jsonResponse({ profileIconId: 12, summonerLevel: 345 })]);

    const summoner = await client.getSummonerByPuuid("na1", "p1");

    expect(summoner.summonerLevel).toBe(345);
    const [url] = fetchImpl.mock.calls[0] as [string];
    expect(url).toBe("https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/p1");
  });

  it("requests the top N masteries", async () => {
    const { client, fetchImpl } = setup([
      jsonResponse([{ championId: 103, championLevel: 7, championPoints: 250000 }]),
    ]);

    const mastery = await client.getTopMastery("euw1", "p1", 3);

    expect(mastery).toHaveLength(1);
    const [url] = fetchImpl.mock.calls[0] as [string];
    expect(url).toContain("/champion-masteries/by-puuid/p1/top?count=3");
  });

  it("throws RiotApiError with the status for non-OK responses", async () => {
    const { client } = setup([jsonResponse({ status: { message: "Data not found" } }, 404)]);

    const err = await client.getAccountByRiotId("euw1", "Nobody", "000").catch((e: unknown) => e);

    expect(err).toBeInstanceOf(RiotApiError);
    expect((err as RiotApiError).status).toBe(404);
  });

  it("retries once after a 429, waiting for Retry-After", async () => {
    const { client, fetchImpl, clock } = setup([
      jsonResponse({}, 429, { "Retry-After": "2" }),
      jsonResponse({ profileIconId: 1, summonerLevel: 30 }),
    ]);

    const summoner = await client.getSummonerByPuuid("euw1", "p1");

    expect(summoner.summonerLevel).toBe(30);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(clock.now()).toBeGreaterThanOrEqual(2000);
  });

  it("gives up with a 429 error once retries are exhausted", async () => {
    const { client, fetchImpl } = setup(
      [jsonResponse({}, 429, { "Retry-After": "1" }), jsonResponse({}, 429, { "Retry-After": "1" })],
      1,
    );

    const err = await client.getSummonerByPuuid("euw1", "p1").catch((e: unknown) => e);

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect((err as RiotApiError).status).toBe(429);
  });

  it("rejects responses that don't match the expected shape", async () => {
    const { client } = setup([jsonResponse({ unexpected: true })]);

    const err = await client.getSummonerByPuuid("euw1", "p1").catch((e: unknown) => e);

    expect(err).toBeInstanceOf(RiotApiError);
    expect((err as RiotApiError).status).toBe(502);
  });
});
