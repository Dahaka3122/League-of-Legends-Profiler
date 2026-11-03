import type { RiotMatch, RiotParticipant } from "../src/riot/types.js";

/** A clock you control: sleeping just moves time forward, so tests run instantly. */
export function fakeClock() {
  let t = 0;
  return {
    now: () => t,
    sleep: async (ms: number) => {
      t += ms;
    },
    advance: (ms: number) => {
      t += ms;
    },
  };
}

export function makeParticipant(overrides: Partial<RiotParticipant> = {}): RiotParticipant {
  return {
    puuid: "me",
    riotIdGameName: "Tester",
    riotIdTagline: "EUW",
    championName: "Ahri",
    champLevel: 16,
    teamId: 100,
    teamPosition: "MIDDLE",
    win: true,
    kills: 10,
    deaths: 0,
    assists: 5,
    totalMinionsKilled: 180,
    neutralMinionsKilled: 20,
    visionScore: 25,
    totalDamageDealtToChampions: 24000,
    goldEarned: 13000,
    item0: 1,
    item1: 2,
    item2: 3,
    item3: 0,
    item4: 0,
    item5: 0,
    item6: 3340,
    ...overrides,
  };
}

export function makeMatch(
  id: string,
  gameCreation: number,
  participant: Partial<RiotParticipant> = {},
  gameDuration = 1800,
): RiotMatch {
  return {
    metadata: { matchId: id },
    info: {
      gameCreation,
      gameDuration,
      queueId: 420,
      gameMode: "CLASSIC",
      participants: [makeParticipant(participant), makeParticipant({ puuid: "other", teamId: 200, win: false })],
    },
  };
}

/** Build a match from an explicit list of participants (for team/sorting tests). */
export function makeMatchWith(id: string, participants: RiotParticipant[], gameDuration = 1800): RiotMatch {
  return {
    metadata: { matchId: id },
    info: { gameCreation: 1000, gameDuration, queueId: 420, gameMode: "CLASSIC", participants },
  };
}

export function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}
