import { z } from "zod";

// zod schemas validate what Riot actually sends us at runtime, and give us
// TypeScript types for free via z.infer. Unknown extra fields are ignored.

export const accountSchema = z.object({
  puuid: z.string(),
  gameName: z.string(),
  tagLine: z.string(),
});
export type RiotAccount = z.infer<typeof accountSchema>;

export const summonerSchema = z.object({
  profileIconId: z.number(),
  summonerLevel: z.number(),
});
export type RiotSummoner = z.infer<typeof summonerSchema>;

export const leagueEntrySchema = z.object({
  queueType: z.string(), // e.g. RANKED_SOLO_5x5, RANKED_FLEX_SR
  tier: z.string(),
  rank: z.string(),
  leaguePoints: z.number(),
  wins: z.number(),
  losses: z.number(),
});
export type RiotLeagueEntry = z.infer<typeof leagueEntrySchema>;

export const masterySchema = z.object({
  championId: z.number(),
  championLevel: z.number(),
  championPoints: z.number(),
});
export type RiotMastery = z.infer<typeof masterySchema>;

export const participantSchema = z.object({
  puuid: z.string(),
  riotIdGameName: z.string().optional(),
  riotIdTagline: z.string().optional(),
  championName: z.string(),
  champLevel: z.number(),
  teamId: z.number(),
  teamPosition: z.string().optional(),
  // Arena only: which duo the player is in (1-based) and where that duo finished.
  playerSubteamId: z.number().optional(),
  subteamPlacement: z.number().optional(),
  win: z.boolean(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  totalMinionsKilled: z.number(),
  neutralMinionsKilled: z.number(),
  visionScore: z.number(),
  totalDamageDealtToChampions: z.number(),
  goldEarned: z.number(),
  item0: z.number(),
  item1: z.number(),
  item2: z.number(),
  item3: z.number(),
  item4: z.number(),
  item5: z.number(),
  item6: z.number(),
});
export type RiotParticipant = z.infer<typeof participantSchema>;

export const matchSchema = z.object({
  metadata: z.object({ matchId: z.string() }),
  info: z.object({
    gameCreation: z.number(),
    gameDuration: z.number(), // seconds
    queueId: z.number(),
    gameMode: z.string(),
    participants: z.array(participantSchema),
  }),
});
export type RiotMatch = z.infer<typeof matchSchema>;
