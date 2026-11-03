// Riot has two kinds of hosts:
//  - platform hosts (euw1, na1, ...) for summoner / league / mastery data
//  - regional hosts (europe, americas, asia, sea) for account-v1 and match-v5

export const PLATFORMS = [
  "br1", "eun1", "euw1", "jp1", "kr", "la1", "la2", "me1",
  "na1", "oc1", "ph2", "ru", "sg2", "th2", "tr1", "tw2", "vn2",
] as const;

export type Platform = (typeof PLATFORMS)[number];
export type RegionalHost = "americas" | "asia" | "europe" | "sea";

const REGIONAL_BY_PLATFORM: Record<Platform, RegionalHost> = {
  na1: "americas",
  br1: "americas",
  la1: "americas",
  la2: "americas",
  kr: "asia",
  jp1: "asia",
  eun1: "europe",
  euw1: "europe",
  tr1: "europe",
  ru: "europe",
  me1: "europe",
  oc1: "sea",
  ph2: "sea",
  sg2: "sea",
  th2: "sea",
  tw2: "sea",
  vn2: "sea",
};

export function isPlatform(value: string): value is Platform {
  return (PLATFORMS as readonly string[]).includes(value);
}

export function regionalHostFor(platform: Platform): RegionalHost {
  return REGIONAL_BY_PLATFORM[platform];
}

export function platformUrl(platform: Platform): string {
  return `https://${platform}.api.riotgames.com`;
}

export function regionalUrl(host: RegionalHost): string {
  return `https://${host}.api.riotgames.com`;
}
