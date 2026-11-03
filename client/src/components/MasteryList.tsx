import { championIcon, type DDragon } from "../ddragon";
import { formatPoints } from "../format";
import type { MasteryInfo } from "../types";

export function MasteryList({ mastery, dd }: { mastery: MasteryInfo[]; dd: DDragon }) {
  return (
    <section className="rounded-xl border border-line bg-panel p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Top mastery</h2>
      {mastery.length === 0 ? (
        <p className="text-sm text-muted">No mastery data</p>
      ) : (
        <ul className="space-y-2">
          {mastery.map((m) => {
            const name = dd.championById[m.championId];
            return (
              <li key={m.championId} className="flex items-center gap-3 rounded-lg bg-panel-2 p-2">
                {name ? (
                  <img src={championIcon(dd.version, name)} alt={name} className="h-10 w-10 rounded-lg" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-line" aria-hidden />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold">{name ?? `Champion ${m.championId}`}</p>
                  <p className="text-xs text-muted">Mastery {m.level}</p>
                </div>
                <p className="text-sm font-bold text-gold">{formatPoints(m.points)}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
