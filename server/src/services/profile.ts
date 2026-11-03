import type { Cache } from "../cache.js";
import type { RiotClient } from "../riot/client.js";
import { regionalHostFor, type Platform } from "../riot/regions.js";
import type { RiotMatch, RiotParticipant } from "../riot/types.js";

// This is what the frontend receives. Keep this small and stable, the UI depends on it.

export interface RankedInfo {
  queue: "SOLO" | "FLEX";
  tier: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
  winrate: number;
}

export interface MasteryInfo {
  championId: number;
  level: number;
  points: number;
}

export interface MatchSummary {
  matchId: string;
  queueId: number;
  gameMode: string;
  playedAt: number;
  durationSec: number;
  win: boolean;
  championName: string;
  champLevel: number;
  role: string;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  cs: number;
  csPerMin: number;
  visionScore: number;
  damage: number;
  gold: number;
  items: number[];
  placement: number | null;
  teams: TeamSummary[];
  participants: ParticipantSummary[];
}

export interface ParticipantSummary {
  name: string;
  tag: string;
  isSelf: boolean; 
  championName: string;
  champLevel: number;
  teamId: number; 
  placement: number | null;
  role: string; 
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  cs: number;
  visionScore: number;
  damage: number;
  damageShare: number; 
  gold: number;
  items: number[];
}

export interface TeamSummary {
  teamId: number; 
  placement: number | null;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  gold: number;
  damage: number;
}

export interface Profile {
  region: Platform;
  gameName: string;
  tagLine: string;
  puuid: string;
  level: number;
  profileIconId: number;
  ranked: RankedInfo[];
  topMastery: MasteryInfo[];
  matches: MatchSummary[];
}

const PROFILE_TTL_MS = 2 * 60_000;

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

const ROLE_ORDER = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];
const roleRank = (role: string) => {
  const i = ROLE_ORDER.indexOf(role);
  return i === -1 ? ROLE_ORDER.length : i;
};


const groupId = (p: RiotParticipant) => p.playerSubteamId || p.teamId;
const placementOf = (p: RiotParticipant): number | null => p.subteamPlacement || null;

function summarizeParticipant(p: RiotParticipant, puuid: string, teamDamage: number): ParticipantSummary {
  return {
    name: p.riotIdGameName || "Unknown",
    tag: p.riotIdTagline ?? "",
    isSelf: p.puuid === puuid,
    championName: p.championName,
    champLevel: p.champLevel,
    teamId: groupId(p),
    placement: placementOf(p),
    role: p.teamPosition ?? "",
    win: p.win,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    kda: round2((p.kills + p.assists) / Math.max(1, p.deaths)),
    cs: p.totalMinionsKilled + p.neutralMinionsKilled,
    visionScore: p.visionScore,
    damage: p.totalDamageDealtToChampions,
    damageShare: teamDamage > 0 ? round1((p.totalDamageDealtToChampions / teamDamage) * 100) : 0,
    gold: p.goldEarned,
    items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6],
  };
}

function summarizeTeams(participants: RiotParticipant[]): TeamSummary[] {
  const byTeam = new Map<number, TeamSummary>();
  for (const p of participants) {
    const t = byTeam.get(groupId(p)) ?? {
      teamId: groupId(p),
      placement: placementOf(p),
      win: p.win,
      kills: 0,
      deaths: 0,
      assists: 0,
      gold: 0,
      damage: 0,
    };
    t.kills += p.kills;
    t.deaths += p.deaths;
    t.assists += p.assists;
    t.gold += p.goldEarned;
    t.damage += p.totalDamageDealtToChampions;
    byTeam.set(groupId(p), t);
  }
  const teams = [...byTeam.values()];
  const ranked = teams.every((t) => t.placement !== null);
  return teams.sort((a, b) => (ranked ? a.placement! - b.placement! : 0) || a.teamId - b.teamId);
}

export function summarizeMatch(match: RiotMatch, puuid: string): MatchSummary | undefined {
  const p = match.info.participants.find((x) => x.puuid === puuid);
  if (!p) return undefined;

  const cs = p.totalMinionsKilled + p.neutralMinionsKilled;
  const minutes = match.info.gameDuration / 60;

  const teams = summarizeTeams(match.info.participants);
  const damageByTeam = new Map(teams.map((t) => [t.teamId, t.damage]));
  const teamOrder = new Map(teams.map((t, i) => [t.teamId, i]));
  const participants = match.info.participants
    .map((x) => summarizeParticipant(x, puuid, damageByTeam.get(groupId(x)) ?? 0))
    .sort(
      (a, b) =>
        (teamOrder.get(a.teamId) ?? 0) - (teamOrder.get(b.teamId) ?? 0) || roleRank(a.role) - roleRank(b.role),
    );

  return {
    matchId: match.metadata.matchId,
    queueId: match.info.queueId,
    gameMode: match.info.gameMode,
    playedAt: match.info.gameCreation,
    durationSec: match.info.gameDuration,
    win: p.win,
    championName: p.championName,
    champLevel: p.champLevel,
    role: p.teamPosition ?? "",
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    kda: round2((p.kills + p.assists) / Math.max(1, p.deaths)),
    cs,
    csPerMin: minutes > 0 ? round2(cs / minutes) : 0,
    visionScore: p.visionScore,
    damage: p.totalDamageDealtToChampions,
    gold: p.goldEarned,
    items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6],
    placement: placementOf(p),
    teams,
    participants,
  };
}

export class ProfileService {
  constructor(
    private readonly riot: RiotClient,
    private readonly cache: Cache,
  ) {}

  async getProfile(platform: Platform, gameName: string, tagLine: string): Promise<Profile> {
    const key = `profile:${platform}:${gameName.toLowerCase()}#${tagLine.toLowerCase()}`;
    const cached = await this.cache.get<Profile>(key);
    if (cached) return cached;

    const host = regionalHostFor(platform);
    const account = await this.riot.getAccountByRiotId(platform, gameName, tagLine);

    const [summoner, entries, mastery, matchIds] = await Promise.all([
      this.riot.getSummonerByPuuid(platform, account.puuid),
      this.riot.getRankedEntries(platform, account.puuid),
      this.riot.getTopMastery(platform, account.puuid, 3),
      this.riot.getMatchIds(host, account.puuid, 10),
    ]);

    const matches = await Promise.all(matchIds.map((id) => this.riot.getMatch(host, id)));

    const ranked: RankedInfo[] = entries.flatMap((e) => {
      const queue = e.queueType === "RANKED_SOLO_5x5" ? "SOLO" : e.queueType === "RANKED_FLEX_SR" ? "FLEX" : undefined;
      if (!queue) return [];
      const games = e.wins + e.losses;
      return [{
        queue,
        tier: e.tier,
        rank: e.rank,
        lp: e.leaguePoints,
        wins: e.wins,
        losses: e.losses,
        winrate: games > 0 ? Math.round((e.wins / games) * 100) : 0,
      }];
    });

    const profile: Profile = {
      region: platform,
      gameName: account.gameName,
      tagLine: account.tagLine,
      puuid: account.puuid,
      level: summoner.summonerLevel,
      profileIconId: summoner.profileIconId,
      ranked,
      topMastery: mastery.map((m) => ({
        championId: m.championId,
        level: m.championLevel,
        points: m.championPoints,
      })),
      matches: matches
        .map((m) => summarizeMatch(m, account.puuid))
        .filter((m): m is MatchSummary => m !== undefined)
        .sort((a, b) => b.playedAt - a.playedAt),
    };

    await this.cache.set(key, profile, PROFILE_TTL_MS);
    return profile;
  }
}
