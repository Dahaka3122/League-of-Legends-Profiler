import { describe, expect, it, vi } from "vitest";
import { MemoryCache } from "../src/cache.js";
import type { RiotClient } from "../src/riot/client.js";
import { ProfileService, summarizeMatch } from "../src/services/profile.js";
import { makeMatch, makeMatchWith, makeParticipant } from "./helpers.js";

describe("summarizeMatch", () => {
  it("computes KDA, CS and CS/min for the requested player", () => {
    const match = makeMatch("EUW1_1", 1000, { kills: 10, deaths: 2, assists: 5 }, 1800);

    const s = summarizeMatch(match, "me");

    expect(s).toMatchObject({
      matchId: "EUW1_1",
      win: true,
      championName: "Ahri",
      role: "MIDDLE",
      kills: 10,
      deaths: 2,
      assists: 5,
      kda: 7.5, // (10 + 5) / 2
      cs: 200, // 180 lane + 20 jungle
      csPerMin: 6.67, // 200 / 30 min
      visionScore: 25,
    });
    expect(s?.items).toEqual([1, 2, 3, 0, 0, 0, 3340]);
  });

  it("treats zero deaths as one death so KDA never divides by zero", () => {
    const match = makeMatch("EUW1_2", 1000, { kills: 10, deaths: 0, assists: 5 });
    expect(summarizeMatch(match, "me")?.kda).toBe(15);
  });

  it("returns undefined if the player is not in the match", () => {
    expect(summarizeMatch(makeMatch("EUW1_3", 1000), "stranger")).toBeUndefined();
  });

  it("reports a loss for the right player", () => {
    const match = makeMatch("EUW1_4", 1000, { win: false });
    expect(summarizeMatch(match, "me")?.win).toBe(false);
    expect(summarizeMatch(match, "other")?.win).toBe(false);
  });
});

describe("summarizeMatch: participants and teams", () => {
  // Deliberately shuffled input: Riot doesn't guarantee display order.
  const match = makeMatchWith("EUW1_9", [
    makeParticipant({ puuid: "b-adc", riotIdGameName: "BlueAdc", teamId: 100, teamPosition: "BOTTOM", kills: 5, deaths: 1, assists: 3, totalDamageDealtToChampions: 10000, goldEarned: 11000, win: true }),
    makeParticipant({ puuid: "r-top", riotIdGameName: "RedTop", teamId: 200, teamPosition: "TOP", kills: 2, deaths: 6, assists: 1, totalDamageDealtToChampions: 8000, goldEarned: 9000, win: false }),
    makeParticipant({ puuid: "me", riotIdGameName: "Tester", teamId: 100, teamPosition: "MIDDLE", kills: 10, deaths: 2, assists: 5, totalDamageDealtToChampions: 30000, goldEarned: 14000, win: true }),
    makeParticipant({ puuid: "b-top", riotIdGameName: "BlueTop", teamId: 100, teamPosition: "TOP", kills: 1, deaths: 3, assists: 9, totalDamageDealtToChampions: 10000, goldEarned: 10000, win: true }),
    makeParticipant({ puuid: "r-sup", riotIdGameName: "RedSup", teamId: 200, teamPosition: "UTILITY", kills: 0, deaths: 7, assists: 4, totalDamageDealtToChampions: 2000, goldEarned: 6000, win: false }),
  ]);
  const summary = summarizeMatch(match, "me")!;

  it("orders players by team, then by role", () => {
    expect(summary.participants.map((p) => p.name)).toEqual(["BlueTop", "Tester", "BlueAdc", "RedTop", "RedSup"]);
  });

  it("marks only the requested player as isSelf", () => {
    expect(summary.participants.filter((p) => p.isSelf).map((p) => p.name)).toEqual(["Tester"]);
  });

  it("never exposes Riot puuids to the client", () => {
    for (const p of summary.participants) expect("puuid" in p).toBe(false);
    expect(JSON.stringify(summary.participants)).not.toContain("b-adc");
  });

  it("computes each player's share of their own team's damage", () => {
    const share = Object.fromEntries(summary.participants.map((p) => [p.name, p.damageShare]));
    // Blue team total = 10000 + 30000 + 10000 = 50000; red = 10000
    expect(share).toEqual({ BlueTop: 20, Tester: 60, BlueAdc: 20, RedTop: 80, RedSup: 20 });
  });

  it("sums team totals and keeps the win flag", () => {
    expect(summary.teams).toEqual([
      { teamId: 100, placement: null, win: true, kills: 16, deaths: 6, assists: 17, gold: 35000, damage: 50000 },
      { teamId: 200, placement: null, win: false, kills: 2, deaths: 13, assists: 5, gold: 15000, damage: 10000 },
    ]);
  });

  it("has no placement outside Arena", () => {
    expect(summary.placement).toBeNull();
    expect(summary.participants.every((p) => p.placement === null)).toBe(true);
  });

  it("falls back to 'Unknown' when Riot sends no name, and 0% share for a zero-damage team", () => {
    const m = makeMatchWith("EUW1_10", [
      makeParticipant({ puuid: "me", riotIdGameName: "", totalDamageDealtToChampions: 0 }),
      makeParticipant({ puuid: "x", teamId: 200, totalDamageDealtToChampions: 5000 }),
    ]);
    const s = summarizeMatch(m, "me")!;
    expect(s.participants[0]?.name).toBe("Unknown");
    expect(s.participants[0]?.damageShare).toBe(0);
  });

  it("handles modes with many teams and no roles (Arena-style)", () => {
    const m = makeMatchWith(
      "EUW1_11",
      [100, 200, 300, 400].flatMap((teamId) => [
        makeParticipant({ puuid: teamId === 300 ? "me" : `p${teamId}a`, teamId, teamPosition: "" }),
        makeParticipant({ puuid: `p${teamId}b`, teamId, teamPosition: "" }),
      ]),
    );
    const s = summarizeMatch(m, "me")!;
    expect(s.teams.map((t) => t.teamId)).toEqual([100, 200, 300, 400]);
    expect(s.participants).toHaveLength(8);
  });
});

describe("summarizeMatch: Arena duos", () => {
  // Riot gives Arena players teamId 100/200 (the two halves) plus a duo id and the duo's place.
  const duo = (subteam: number, place: number, names: [string, string], win: boolean, dmg: [number, number]) =>
    names.map((name, i) =>
      makeParticipant({
        puuid: name === "Me" ? "me" : name,
        riotIdGameName: name,
        teamId: subteam <= 4 ? 100 : 200,
        teamPosition: "",
        playerSubteamId: subteam,
        subteamPlacement: place,
        win,
        kills: 3,
        deaths: 1,
        assists: 2,
        totalDamageDealtToChampions: dmg[i]!,
        goldEarned: 5000,
      }),
    );

  // Shuffled on purpose: subteam ids 1..4 finished 3rd, 1st, 4th, 2nd.
  const match = makeMatchWith("EUW1_A", [
    ...duo(1, 3, ["A1", "A2"], false, [1000, 1000]),
    ...duo(2, 1, ["Me", "B2"], true, [6000, 2000]),
    ...duo(3, 4, ["C1", "C2"], false, [500, 500]),
    ...duo(4, 2, ["D1", "D2"], true, [3000, 1000]),
  ]);
  const summary = summarizeMatch(match, "me")!;

  it("groups players by duo and orders the duos by placement, best first", () => {
    expect(summary.teams.map((t) => [t.teamId, t.placement])).toEqual([
      [2, 1],
      [4, 2],
      [1, 3],
      [3, 4],
    ]);
    expect(summary.participants.map((p) => p.name)).toEqual(["Me", "B2", "D1", "D2", "A1", "A2", "C1", "C2"]);
  });

  it("reports the profile owner's own placement", () => {
    expect(summary.placement).toBe(1);
  });

  it("carries the duo's win flag and per-duo totals", () => {
    expect(summary.teams[0]).toEqual({
      teamId: 2, placement: 1, win: true, kills: 6, deaths: 2, assists: 4, gold: 10000, damage: 8000,
    });
    expect(summary.teams[3]?.win).toBe(false);
  });

  it("computes damage share within the duo", () => {
    const me = summary.participants.find((p) => p.isSelf)!;
    expect(me.damageShare).toBe(75); // 6000 of the duo's 8000
    expect(summary.participants.find((p) => p.name === "B2")?.damageShare).toBe(25);
  });

  it("puts every participant in exactly one duo group", () => {
    const groupIds = new Set(summary.teams.map((t) => t.teamId));
    expect(summary.participants.every((p) => groupIds.has(p.teamId))).toBe(true);
  });
});

describe("summarizeMatch: Riot sends 0 for the Arena-only fields in normal modes", () => {
  // Regression: 0 is a real number, so `playerSubteamId ?? teamId` put all 10 players in one group.
  const quirky = (puuid: string, name: string, teamId: number, role: string, win: boolean) =>
    makeParticipant({ puuid, riotIdGameName: name, teamId, teamPosition: role, win, playerSubteamId: 0, subteamPlacement: 0 });

  const match = makeMatchWith("EUW1_Q", [
    quirky("me", "Tester", 100, "BOTTOM", true),
    quirky("a", "BlueTop", 100, "TOP", true),
    quirky("b", "RedTop", 200, "TOP", false),
    quirky("c", "RedSup", 200, "UTILITY", false),
  ]);
  const summary = summarizeMatch(match, "me")!;

  it("still splits players into the two real teams", () => {
    expect(summary.teams.map((t) => t.teamId)).toEqual([100, 200]);
    expect(summary.participants.map((p) => [p.name, p.teamId])).toEqual([
      ["BlueTop", 100],
      ["Tester", 100],
      ["RedTop", 200],
      ["RedSup", 200],
    ]);
  });

  it("treats a 0 placement as 'no placement'", () => {
    expect(summary.placement).toBeNull();
    expect(summary.teams.every((t) => t.placement === null)).toBe(true);
    expect(summary.participants.every((p) => p.placement === null)).toBe(true);
  });
});

describe("summarizeMatch: Arena with trios (6 teams of 3)", () => {
  // Arena is currently 18 players: six subteams of three, split across Riot teams 100 and 200.
  const places = [4, 1, 6, 2, 5, 3]; // finishing place of subteams 1..6
  const players = [1, 2, 3, 4, 5, 6].flatMap((subteam) =>
    [0, 1, 2].map((slot) =>
      makeParticipant({
        puuid: subteam === 5 && slot === 0 ? "me" : `s${subteam}p${slot}`,
        riotIdGameName: `S${subteam}P${slot}`,
        teamId: subteam <= 3 ? 100 : 200,
        teamPosition: "",
        playerSubteamId: subteam,
        subteamPlacement: places[subteam - 1]!,
        win: places[subteam - 1]! <= 3,
      }),
    ),
  );
  const summary = summarizeMatch(makeMatchWith("EUW1_T", players), "me")!;

  it("makes six groups of three, ordered by placement", () => {
    expect(summary.teams.map((t) => [t.teamId, t.placement])).toEqual([
      [2, 1], [4, 2], [6, 3], [1, 4], [5, 5], [3, 6],
    ]);
    for (const t of summary.teams) {
      expect(summary.participants.filter((p) => p.teamId === t.teamId)).toHaveLength(3);
    }
  });

  it("reports the profile owner's placement", () => {
    expect(summary.placement).toBe(5);
  });
});

function fakeRiot() {
  const matches = {
    A: makeMatch("A", 1_000),
    B: makeMatch("B", 3_000),
    C: makeMatch("C", 2_000),
  };
  return {
    getAccountByRiotId: vi.fn().mockResolvedValue({ puuid: "me", gameName: "Tester", tagLine: "EUW" }),
    getSummonerByPuuid: vi.fn().mockResolvedValue({ profileIconId: 5, summonerLevel: 321 }),
    getRankedEntries: vi.fn().mockResolvedValue([
      { queueType: "RANKED_SOLO_5x5", tier: "GOLD", rank: "II", leaguePoints: 45, wins: 60, losses: 40 },
      { queueType: "RANKED_TFT_DOUBLE_UP", tier: "SILVER", rank: "I", leaguePoints: 10, wins: 1, losses: 1 },
    ]),
    getTopMastery: vi.fn().mockResolvedValue([
      { championId: 103, championLevel: 7, championPoints: 250000 },
      { championId: 1, championLevel: 6, championPoints: 100000 },
    ]),
    getMatchIds: vi.fn().mockResolvedValue(["A", "B", "C"]),
    getMatch: vi.fn().mockImplementation(async (_host: string, id: keyof typeof matches) => matches[id]),
  };
}

describe("ProfileService", () => {
  it("assembles a profile from the Riot responses", async () => {
    const riot = fakeRiot();
    const service = new ProfileService(riot as unknown as RiotClient, new MemoryCache());

    const profile = await service.getProfile("euw1", "Tester", "EUW");

    expect(profile).toMatchObject({
      region: "euw1",
      gameName: "Tester",
      tagLine: "EUW",
      level: 321,
      profileIconId: 5,
    });
    expect(profile.topMastery).toEqual([
      { championId: 103, level: 7, points: 250000 },
      { championId: 1, level: 6, points: 100000 },
    ]);
  });

  it("keeps only solo/flex ranked queues and computes winrate", async () => {
    const service = new ProfileService(fakeRiot() as unknown as RiotClient, new MemoryCache());

    const profile = await service.getProfile("euw1", "Tester", "EUW");

    expect(profile.ranked).toEqual([
      { queue: "SOLO", tier: "GOLD", rank: "II", lp: 45, wins: 60, losses: 40, winrate: 60 },
    ]);
  });

  it("sorts matches newest first", async () => {
    const service = new ProfileService(fakeRiot() as unknown as RiotClient, new MemoryCache());

    const profile = await service.getProfile("euw1", "Tester", "EUW");

    expect(profile.matches.map((m) => m.matchId)).toEqual(["B", "C", "A"]);
  });

  it("asks Riot for matches on the regional host", async () => {
    const riot = fakeRiot();
    const service = new ProfileService(riot as unknown as RiotClient, new MemoryCache());

    await service.getProfile("euw1", "Tester", "EUW");

    expect(riot.getMatchIds).toHaveBeenCalledWith("europe", "me", 10);
  });

  it("serves repeat lookups from the cache (case-insensitive) without calling Riot again", async () => {
    const riot = fakeRiot();
    const service = new ProfileService(riot as unknown as RiotClient, new MemoryCache());

    await service.getProfile("euw1", "Tester", "EUW");
    await service.getProfile("euw1", "tester", "euw");

    expect(riot.getAccountByRiotId).toHaveBeenCalledTimes(1);
    expect(riot.getMatch).toHaveBeenCalledTimes(3);
  });
});
