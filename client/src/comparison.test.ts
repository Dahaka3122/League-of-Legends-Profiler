import { describe, expect, it } from "vitest";
import { compareMatches } from "./comparison";
import type { MatchSummary, ParticipantSummary, TeamSummary } from "./types";

function fixture(overrides: Partial<MatchSummary> = {}): MatchSummary {
  return {
    matchId: "test", queueId: 420, gameMode: "CLASSIC", playedAt: 1, durationSec: 1200,
    win: true, championName: "Ahri", champLevel: 18, role: "MIDDLE", kills: 5, deaths: 2,
    assists: 5, kda: 5, cs: 120, csPerMin: 6, visionScore: 20, damage: 10000, gold: 10000,
    items: [], placement: null,
    participants: [{ isSelf: false, teamId: 200 }, { isSelf: true, teamId: 100 }] as ParticipantSummary[],
    teams: [{ teamId: 200, kills: 100, damage: 100000 }, { teamId: 100, kills: 20, damage: 40000 }] as TeamSummary[],
    ...overrides,
  };
}

describe("compareMatches", () => {
  it("sorts without mutation, filters queues and compares equal windows", () => {
    const matches = [fixture({ playedAt: 1, win: false, csPerMin: 2 }), fixture({ playedAt: 4, csPerMin: 8 }), fixture({ playedAt: 3, csPerMin: 4 }), fixture({ playedAt: 2, win: false, csPerMin: 6 }), fixture({ queueId: 450, playedAt: 5 })];
    const result = compareMatches(matches, 420)!;
    expect(result.recent).toMatchObject({ count: 2, wins: 2, losses: 0, winrate: 100, csPerMin: 6 });
    expect(result.previous).toMatchObject({ count: 2, wins: 0, losses: 2, winrate: 0, csPerMin: 4 });
    expect(matches.map((m) => m.playedAt)).toEqual([1, 4, 3, 2, 5]);
  });
  it("uses the owner's team for kill participation and damage share", () => {
    const result = compareMatches([fixture(), fixture()], 420)!;
    expect(result.recent).toMatchObject({ killParticipation: 50, damageShare: 25, vision: 20 });
  });
  it("excludes the oldest match when the count is odd", () => {
    const result = compareMatches([fixture({ playedAt: 1, csPerMin: 99 }), fixture({ playedAt: 2 }), fixture({ playedAt: 3 })], 420)!;
    expect(result).toMatchObject({ omitted: 1, recent: { count: 1 }, previous: { count: 1, csPerMin: 6 } });
  });
  it("requires at least two matches in the selected queue", () => {
    expect(compareMatches([], 420)).toBeNull();
    expect(compareMatches([fixture(), fixture({ queueId: 450 })], 420)).toBeNull();
  });
  it("does not turn missing data or zero denominators into zero performance", () => {
    const result = compareMatches([fixture({ teams: [] }), fixture({ teams: [{ teamId: 100, kills: 0, damage: 0 }] as TeamSummary[] })], 420)!;
    expect(result.recent.killParticipation).toBeNull();
    expect(result.previous.damageShare).toBeNull();
    const mixed = compareMatches([fixture({ playedAt: 4, teams: [] }), fixture({ playedAt: 3 }), fixture({ playedAt: 2 }), fixture()], 420)!;
    expect(mixed.recent.killParticipation).toBe(50);
    expect(mixed.recent.damageShare).toBe(25);
  });
  it("marks CS and vision as unavailable for Arena but retains team shares", () => {
    const matches = [fixture({ gameMode: "CHERRY" }), fixture({ gameMode: "CHERRY" })];
    expect(compareMatches(matches, 420)?.recent).toMatchObject({ csPerMin: null, vision: null, killParticipation: 50, damageShare: 25 });
  });
});
