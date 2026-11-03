/*
  * Client-side types mirror the profile API response.
  * Keep these definitions synchronized with the server.
*/

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
  region: string;
  gameName: string;
  tagLine: string;
  puuid: string;
  level: number;
  profileIconId: number;
  ranked: RankedInfo[];
  topMastery: MasteryInfo[];
  matches: MatchSummary[];
}

export const REGIONS: { value: string; label: string }[] = [
  { value: "euw1", label: "EUW" },
  { value: "eun1", label: "EUNE" },
  { value: "na1", label: "NA" },
  { value: "kr", label: "KR" },
  { value: "br1", label: "BR" },
  { value: "la1", label: "LAN" },
  { value: "la2", label: "LAS" },
  { value: "jp1", label: "JP" },
  { value: "oc1", label: "OCE" },
  { value: "tr1", label: "TR" },
  { value: "ru", label: "RU" },
  { value: "me1", label: "ME" },
  { value: "sg2", label: "SG" },
  { value: "ph2", label: "PH" },
  { value: "th2", label: "TH" },
  { value: "tw2", label: "TW" },
  { value: "vn2", label: "VN" },
];
