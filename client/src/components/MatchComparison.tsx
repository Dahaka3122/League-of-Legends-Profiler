import { useState } from "react";
import { compareMatches, type MatchAverages } from "../comparison";
import { matchModeLabel } from "../modes";
import type { MatchSummary } from "../types";

const metrics: { key: keyof Pick<MatchAverages, "winrate" | "csPerMin" | "vision" | "killParticipation" | "damageShare">; label: string; percent?: boolean }[] = [
  { key: "winrate", label: "Win rate", percent: true },
  { key: "csPerMin", label: "CS/min" },
  { key: "vision", label: "Vision score" },
  { key: "killParticipation", label: "Kill participation", percent: true },
  { key: "damageShare", label: "Damage share", percent: true },
];
const display = (value: number | null, percent = false) => value === null ? "N/A" : `${value.toFixed(1)}${percent ? "%" : ""}`;

export function MatchComparison({ matches }: { matches: MatchSummary[] }) {
  const ordered = [...matches].sort((a, b) => b.playedAt - a.playedAt);
  const queues = ordered.filter((m, i) => ordered.findIndex((candidate) => candidate.queueId === m.queueId) === i);
  const [selected, setSelected] = useState<number>();
  const queueId = queues.find((m) => m.queueId === selected)?.queueId ?? queues[0]?.queueId;
  const comparison = queueId === undefined ? null : compareMatches(matches, queueId);

  return (
    <section aria-labelledby="comparison-heading" className="rounded-xl border border-line bg-panel p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="comparison-heading" className="text-sm font-semibold uppercase tracking-wide text-muted">Recent performance</h2>
        {queues.length > 0 && (
          <select aria-label="Comparison queue" value={queueId} onChange={(event) => setSelected(Number(event.target.value))} className="rounded border border-line bg-panel-2 p-2 text-sm">
            {queues.map((m) => <option key={m.queueId} value={m.queueId}>{matchModeLabel(m.queueId, m.gameMode)} ({m.queueId})</option>)}
          </select>
        )}
      </div>
      {!comparison ? (
        <p className="text-sm text-muted">At least two matches in the same queue are needed to compare performance.</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">Latest {comparison.recent.count} vs previous {comparison.previous.count} matches in this queue, within the loaded history. {comparison.omitted ? "The oldest match is excluded to keep both groups equal." : ""}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Comparison of recent and previous matches</caption>
              <thead><tr className="text-muted"><th scope="col" className="p-2">Metric</th><th scope="col" className="p-2">Latest</th><th scope="col" className="p-2">Previous</th><th scope="col" className="p-2">Change</th></tr></thead>
              <tbody>
                <tr><th scope="row" className="p-2 font-normal">Wins / losses</th><td className="p-2">{comparison.recent.wins}W / {comparison.recent.losses}L</td><td className="p-2">{comparison.previous.wins}W / {comparison.previous.losses}L</td><td className="p-2">—</td></tr>
                {metrics.map(({ key, label, percent }) => {
                  const recent = comparison.recent[key];
                  const previous = comparison.previous[key];
                  const delta = recent === null || previous === null ? null : recent - previous;
                  const rounded = delta === null ? null : Number(delta.toFixed(1));
                  return <tr key={key} className="border-t border-line"><th scope="row" className="p-2 font-normal">{label}</th><td className="p-2">{display(recent, percent)}</td><td className="p-2">{display(previous, percent)}</td><td className="p-2 whitespace-nowrap">{rounded === null ? "N/A" : `${rounded > 0 ? "+" : ""}${rounded.toFixed(1)}${percent ? " pp" : ""}`}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">Per-match averages. Kill participation = (kills + assists) / team kills; damage share = champion damage / team champion damage. Missing shares and zero denominators are excluded from averages. CS/min and vision are N/A in Arena. Different roles, champions and match lengths affect results; this is a small sample, not a skill rating.</p>
        </>
      )}
    </section>
  );
}
