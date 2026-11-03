export function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function timeAgo(epochMs: number, nowMs: number = Date.now()): string {
  const diffSec = Math.max(0, Math.floor((nowMs - epochMs) / 1000));
  if (diffSec < 60) return "just now";
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months < 12 ? `${months}mo ago` : `${Math.floor(months / 12)}y ago`;
}

export function formatPoints(points: number): string {
  if (points >= 1_000_000) return `${(points / 1_000_000).toFixed(1)}M`;
  if (points >= 1_000) return `${Math.round(points / 1_000)}k`;
  return String(points);
}

export function formatTier(tier: string, rank: string): string {
  const name = tier.charAt(0) + tier.slice(1).toLowerCase();
  // Master, Grandmaster and Challenger have no divisions.
  return ["MASTER", "GRANDMASTER", "CHALLENGER"].includes(tier) ? name : `${name} ${rank}`;
}

const QUEUE_NAMES: Record<number, string> = {
  400: "Normal Draft",
  420: "Ranked Solo",
  430: "Normal Blind",
  440: "Ranked Flex",
  450: "ARAM",
  480: "Swiftplay",
  490: "Quickplay",
  700: "Clash",
  900: "ARURF",
  1020: "One for All",
  1400: "Ultimate Spellbook",
  1700: "Arena",
  1710: "Arena",
  1900: "Pick URF",
  2400: "ARAM: Mayhem",
};

export function queueName(queueId: number, gameMode: string): string {
  return QUEUE_NAMES[queueId] ?? gameMode;
}
