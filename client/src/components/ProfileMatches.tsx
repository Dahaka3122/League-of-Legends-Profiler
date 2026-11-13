import { useEffect, useRef, useState } from "react";
import { fetchMatches } from "../api";
import type { Profile } from "../types";
import { MasteryList } from "./MasteryList";
import { MatchComparison } from "./MatchComparison";
import { MatchList } from "./MatchList";
import { RankedCard } from "./RankedCard";
import type { DDragon } from "../ddragon";

export function ProfileMatches({ profile, dd }: { profile: Profile; dd: DDragon }) {
  const [matches, setMatches] = useState(profile.matches);
  const [nextStart, setNextStart] = useState(profile.nextStart);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const pending = useRef<AbortController>();
  useEffect(() => () => pending.current?.abort(), []);

  async function loadMore() {
    if (pending.current || nextStart === null || matches.length >= 100) return;
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    setError(undefined);
    try {
      const page = await fetchMatches(profile.region, profile.puuid, nextStart, controller.signal);
      if (controller.signal.aborted) return;
      setMatches((current) => [...new Map([...current, ...page.matches].map((match) => [match.matchId, match])).values()]
        .sort((a, b) => b.playedAt - a.playedAt).slice(0, 100));
      setNextStart(page.nextStart);
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Could not load matches");
    } finally {
      if (!controller.signal.aborted) {
        pending.current = undefined;
        setLoading(false);
      }
    }
  }

  return (
    <>
      <MatchComparison matches={matches} />
      <div className="grid gap-6 md:grid-cols-[18rem_1fr]">
        <div className="flex flex-col gap-6">
          <RankedCard ranked={profile.ranked} />
          <MasteryList mastery={profile.topMastery} dd={dd} />
        </div>
        <MatchList matches={matches} version={dd.version}>
          <div className="mt-4 text-center text-sm">
            {error && <p role="alert" className="mb-2 text-loss">{error}</p>}
            {nextStart !== null && matches.length < 100 ? (
              <button type="button" disabled={loading} onClick={() => void loadMore()} className="rounded-lg bg-win px-6 py-3 font-semibold text-white disabled:opacity-60">
                {loading ? "Loading…" : "Load more"}
              </button>
            ) : <p role="status" className="text-muted">{matches.length >= 100 ? "History limit reached (100 matches)." : "No more matches."}</p>}
          </div>
        </MatchList>
      </div>
    </>
  );
}
