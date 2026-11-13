import { describe, expect, it, vi } from "vitest";
import { buildApp } from "../src/app.js";
import { RiotApiError } from "../src/riot/client.js";
import type { Profile } from "../src/services/profile.js";

const sampleProfile: Profile = {
  region: "euw1",
  gameName: "Faker",
  tagLine: "KR1",
  puuid: "p1",
  level: 700,
  profileIconId: 1,
  ranked: [],
  topMastery: [],
  matches: [],
  nextStart: null,
};

function appWith(getProfile: ReturnType<typeof vi.fn>) {
  return buildApp({ getProfile } as never);
}

describe("GET /api/profile/:region/:name/:tag", () => {
  it("returns the profile as JSON", async () => {
    const getProfile = vi.fn().mockResolvedValue(sampleProfile);

    const res = await appWith(getProfile).inject({ method: "GET", url: "/api/profile/euw1/Faker/KR1" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(sampleProfile);
    expect(getProfile).toHaveBeenCalledWith("euw1", "Faker", "KR1");
  });

  it("decodes URL-encoded names", async () => {
    const getProfile = vi.fn().mockResolvedValue(sampleProfile);

    await appWith(getProfile).inject({ method: "GET", url: "/api/profile/kr/Hide%20on%20bush/KR1" });

    expect(getProfile).toHaveBeenCalledWith("kr", "Hide on bush", "KR1");
  });

  it("rejects unknown regions with 400 and never calls the service", async () => {
    const getProfile = vi.fn();

    const res = await appWith(getProfile).inject({ method: "GET", url: "/api/profile/mars/Faker/KR1" });

    expect(res.statusCode).toBe(400);
    expect(getProfile).not.toHaveBeenCalled();
  });

  it("rejects malformed names/tags with 400", async () => {
    const getProfile = vi.fn();
    const app = appWith(getProfile);

    expect((await app.inject({ method: "GET", url: "/api/profile/euw1/ab/KR1" })).statusCode).toBe(400);
    expect((await app.inject({ method: "GET", url: "/api/profile/euw1/Faker/TOOLONGTAG" })).statusCode).toBe(400);
  });

  it("maps a Riot 404 to 404 'Player not found'", async () => {
    const getProfile = vi.fn().mockRejectedValue(new RiotApiError(404, "nope"));

    const res = await appWith(getProfile).inject({ method: "GET", url: "/api/profile/euw1/Nobody/000" });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: "Player not found" });
  });

  it("maps Riot rate limiting to 429", async () => {
    const getProfile = vi.fn().mockRejectedValue(new RiotApiError(429, "slow down"));

    const res = await appWith(getProfile).inject({ method: "GET", url: "/api/profile/euw1/Faker/KR1" });

    expect(res.statusCode).toBe(429);
  });

  it("reports an expired API key as a 502 with a clear message", async () => {
    const getProfile = vi.fn().mockRejectedValue(new RiotApiError(403, "forbidden"));

    const res = await appWith(getProfile).inject({ method: "GET", url: "/api/profile/euw1/Faker/KR1" });

    expect(res.statusCode).toBe(502);
    expect(res.json()).toEqual({ error: "Riot API key is invalid or expired" });
  });
});

describe("GET /api/health", () => {
  it("responds ok", async () => {
    const res = await appWith(vi.fn()).inject({ method: "GET", url: "/api/health" });
    expect(res.json()).toEqual({ ok: true });
  });
});

describe("GET /api/matches/:region/:puuid", () => {
  it("passes a validated offset and player to the service", async () => {
    const getMatchPage = vi.fn().mockResolvedValue({ matches: [], nextStart: 20 });
    const app = buildApp({ getProfile: vi.fn(), getMatchPage });
    const res = await app.inject({ method: "GET", url: "/api/matches/eun1/player-1?start=10" });
    expect(res.statusCode).toBe(200);
    expect(getMatchPage).toHaveBeenCalledWith("eun1", "player-1", 10);
    expect(res.json().nextStart).toBe(20);
    await app.close();
  });
  it("rejects invalid offsets and regions without upstream calls", async () => {
    const getMatchPage = vi.fn();
    const app = buildApp({ getProfile: vi.fn(), getMatchPage });
    for (const url of ["/api/matches/mars/p?start=10", ...["-10", "100", "999", "1", "1.5", "abc", ""].map((start) => `/api/matches/euw1/p?start=${start}`), "/api/matches/euw1/p"]) {
      expect((await app.inject({ method: "GET", url })).statusCode).toBe(400);
    }
    expect(getMatchPage).not.toHaveBeenCalled();
    await app.close();
  });
  it("maps upstream failures on additional pages", async () => {
    const app = buildApp({ getProfile: vi.fn(), getMatchPage: vi.fn().mockRejectedValue(new RiotApiError(429, "limit")) });
    expect((await app.inject({ method: "GET", url: "/api/matches/euw1/p?start=10" })).statusCode).toBe(429);
    await app.close();
  });
});
