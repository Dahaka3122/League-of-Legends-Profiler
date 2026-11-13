import type { MatchPage, Profile } from "./types";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchProfile(region: string, name: string, tag: string): Promise<Profile> {
  const url = `/api/profile/${encodeURIComponent(region)}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;
  return request<Profile>(url);
}

export function fetchMatches(region: string, puuid: string, start: number, signal?: AbortSignal): Promise<MatchPage> {
  return request<MatchPage>(`/api/matches/${encodeURIComponent(region)}/${encodeURIComponent(puuid)}?start=${start}`, signal);
}

async function request<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await (signal ? fetch(url, { signal }) : fetch(url));
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // body wasn't JSON; keep the generic message
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}

/** Parses "Name#TAG" (what players copy from the client). */
export function parseRiotId(input: string): { name: string; tag: string } | undefined {
  const idx = input.lastIndexOf("#");
  if (idx <= 0) return undefined;
  const name = input.slice(0, idx).trim();
  const tag = input.slice(idx + 1).trim();
  return name && tag ? { name, tag } : undefined;
}
