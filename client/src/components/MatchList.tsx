import type { MatchSummary } from "../types";
import { MatchCard } from "./MatchCard";

export function MatchList({ matches, version }: { matches: MatchSummary[]; version: string }) {
  const wins = matches.filter((m) => m.win).length;

  return (
    <section className="rounded-xl border border-line bg-panel p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Match history</h2>
        {matches.length > 0 && (
          <p className="text-sm text-muted">
            Last {matches.length}: <span className="font-semibold text-win">{wins}W</span>{" "}
            <span className="font-semibold text-loss">{matches.length - wins}L</span>
          </p>
        )}
      </div>
      {matches.length === 0 ? (
        <p className="text-sm text-muted">No recent matches</p>
      ) : (
        <ul className="space-y-2">
          {matches.map((m) => (
            <MatchCard key={m.matchId} match={m} version={version} />
          ))}
        </ul>
      )}
    </section>
  );
}
