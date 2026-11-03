import { useQuery } from "@tanstack/react-query";
import { championIconId } from "./champions";

// Data Dragon is Riot's static CDN: icons and names for champions, items, profile icons.
const FALLBACK_VERSION = "14.20.1";

export interface DDragon {
  version: string;
  /** numeric champion id -> image file id, e.g. 103 -> "Ahri" */
  championById: Record<number, string>;
}

async function loadDDragon(): Promise<DDragon> {
  let version = FALLBACK_VERSION;
  try {
    const versions = (await (await fetch("https://ddragon.leagueoflegends.com/api/versions.json")).json()) as string[];
    version = versions[0] ?? FALLBACK_VERSION;
  } catch {
    // offline or blocked: icons still work with the fallback version
  }

  const championById: Record<number, string> = {};
  try {
    const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`);
    const json = (await res.json()) as { data: Record<string, { id: string; key: string }> };
    for (const c of Object.values(json.data)) championById[Number(c.key)] = c.id;
  } catch {
    // mastery icons will fall back to a placeholder
  }

  return { version, championById };
}

export function useDDragon(): DDragon {
  const { data } = useQuery({
    queryKey: ["ddragon"],
    queryFn: loadDDragon,
    staleTime: Infinity,
  });
  return data ?? { version: FALLBACK_VERSION, championById: {} };
}

const base = (v: string) => `https://ddragon.leagueoflegends.com/cdn/${v}/img`;

export const championIcon = (v: string, name: string) => `${base(v)}/champion/${championIconId(name)}.png`;
export const itemIcon = (v: string, id: number) => `${base(v)}/item/${id}.png`;
export const profileIcon = (v: string, id: number) => `${base(v)}/profileicon/${id}.png`;
