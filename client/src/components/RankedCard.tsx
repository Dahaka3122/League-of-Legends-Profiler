import { formatTier } from "../format";
import type { RankedInfo } from "../types";

const QUEUE_LABEL = { SOLO: "Ranked Solo/Duo", FLEX: "Ranked Flex" } as const;

export function RankedCard({ ranked }: { ranked: RankedInfo[] }) {
  return (
    <section className="rounded-xl border border-line bg-panel p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Ranked</h2>
      {ranked.length === 0 ? (
        <p className="text-sm text-muted">Unranked this season</p>
      ) : (
        <ul className="space-y-3">
          {ranked.map((r) => (
            <li key={r.queue} className="rounded-lg bg-panel-2 p-3">
              <p className="text-xs text-muted">{QUEUE_LABEL[r.queue]}</p>
              <p className="text-lg font-bold text-gold">{formatTier(r.tier, r.rank)}</p>
              <p className="text-sm">
                {r.lp} LP · {r.wins}W {r.losses}L · <span className="font-semibold">{r.winrate}%</span> win rate
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-loss" aria-hidden>
                <div className="h-full bg-win" style={{ width: `${r.winrate}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
