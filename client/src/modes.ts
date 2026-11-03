import { queueName } from "./format";

// Riot's internal game-mode codes. Used when a queue id isn't in format.ts's table,
// so a brand-new queue still shows "Arena" instead of "CHERRY".
const GAME_MODE_NAMES: Record<string, string> = {
  CLASSIC: "Summoner's Rift",
  ARAM: "ARAM",
  CHERRY: "Arena",
  URF: "URF",
  ARURF: "ARURF",
  ONEFORALL: "One for All",
  NEXUSBLITZ: "Nexus Blitz",
  ULTBOOK: "Ultimate Spellbook",
};

/** Human-readable mode: known queue id first, then the game-mode code, then the raw code. */
export function matchModeLabel(queueId: number, gameMode: string): string {
  const byQueue = queueName(queueId, gameMode);
  // queueName() returns gameMode itself when it doesn't know the queue id.
  if (byQueue !== gameMode) return byQueue;
  return GAME_MODE_NAMES[gameMode] ?? gameMode;
}

export const isArena = (gameMode: string): boolean => gameMode === "CHERRY";

/** 1 -> "1st", 2 -> "2nd", 11 -> "11th", 22 -> "22nd" */
export function ordinal(n: number): string {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}
