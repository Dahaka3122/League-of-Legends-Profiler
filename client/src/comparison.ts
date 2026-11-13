import type { MatchSummary } from "./types";

export interface MatchAverages {
  count: number;
  wins: number;
  losses: number;
  winrate: number;
  csPerMin: number | null;
  vision: number | null;
  killParticipation: number | null;
  damageShare: number | null;
}

function average(values: (number | null)[]): number | null {
  const valid = values.filter((value): value is number => value !== null && Number.isFinite(value));
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

function summarize(matches: MatchSummary[]): MatchAverages {
  const wins = matches.filter((match) => match.win).length;
  const shares = matches.map((match) => {
    const self = match.participants.find((player) => player.isSelf);
    const team = self && match.teams.find((candidate) => candidate.teamId === self.teamId);
    return {
      kills: team && team.kills > 0 ? ((match.kills + match.assists) / team.kills) * 100 : null,
      damage: team && team.damage > 0 ? (match.damage / team.damage) * 100 : null,
    };
  });
  return {
    count: matches.length,
    wins,
    losses: matches.length - wins,
    winrate: (wins / matches.length) * 100,
    csPerMin: average(matches.map((m) => m.gameMode !== "CHERRY" && m.durationSec > 0 ? m.csPerMin : null)),
    vision: average(matches.map((m) => m.gameMode !== "CHERRY" ? m.visionScore : null)),
    killParticipation: average(shares.map((share) => share.kills)),
    damageShare: average(shares.map((share) => share.damage)),
  };
}

/** Compare equal, consecutive windows within one queue; never mutate the match history. */
export function compareMatches(matches: MatchSummary[], queueId: number) {
  const ordered = matches.filter((match) => match.queueId === queueId).sort((a, b) => b.playedAt - a.playedAt);
  const size = Math.floor(ordered.length / 2);
  if (!size) return null;
  return {
    recent: summarize(ordered.slice(0, size)),
    previous: summarize(ordered.slice(size, size * 2)),
    omitted: ordered.length % 2,
  };
}
