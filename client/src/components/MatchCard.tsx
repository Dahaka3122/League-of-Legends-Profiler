import { useState } from "react";
import { championIcon, itemIcon } from "../ddragon";
import { formatDuration, timeAgo } from "../format";
import { isArena, matchModeLabel, ordinal } from "../modes";
import type { MatchSummary } from "../types";
import { MatchDetails } from "./MatchDetails";

interface Props {
  match: MatchSummary;
  version: string;
  now?: number;
}

export function MatchCard({ match: m, version, now }: Props) {
  const [open, setOpen] = useState(false);
  const tone = m.win ? "border-win bg-win-bg" : "border-loss bg-loss-bg";
  const detailsId = `details-${m.matchId}`;
  const arena = isArena(m.gameMode);

  return (
    <li className={`rounded-lg border-l-4 p-3 ${tone}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="w-20 shrink-0 text-xs">
          <p className={`font-bold ${m.win ? "text-win" : "text-loss"}`}>{m.win ? "Victory" : "Defeat"}</p>
          <p className="text-muted">{matchModeLabel(m.queueId, m.gameMode)}</p>
          {arena && m.placement != null && (
            <p className="font-semibold text-gold">{ordinal(m.placement)} place</p>
          )}
          <p className="text-muted">{timeAgo(m.playedAt, now)}</p>
          <p className="text-muted">{formatDuration(m.durationSec)}</p>
        </div>

        <div className="relative shrink-0">
          <img src={championIcon(version, m.championName)} alt={m.championName} className="h-14 w-14 rounded-lg" />
          <span className="absolute -bottom-1 -right-1 rounded bg-panel px-1 text-[10px] font-bold">{m.champLevel}</span>
        </div>

        <div className="w-24 shrink-0 text-center">
          <p className="text-lg font-bold">
            {m.kills} / <span className="text-loss">{m.deaths}</span> / {m.assists}
          </p>
          <p className="text-xs text-muted">{m.kda.toFixed(2)} KDA</p>
        </div>

        <div className="hidden w-28 shrink-0 text-xs text-muted sm:block">
          {/* Arena has no minions or wards, so CS and vision would always read 0. */}
          {!arena && (
            <>
              <p>
                {m.cs} CS ({m.csPerMin.toFixed(1)}/min)
              </p>
              <p>Vision {m.visionScore}</p>
            </>
          )}
          <p>{m.damage.toLocaleString("en-US")} dmg</p>
          {arena && <p>{(m.gold / 1000).toFixed(1)}k gold</p>}
        </div>

        {/* Items never shrink (fixed-size slots), so a too-narrow row wraps instead of overlapping.
            The toggle is a slim chevron strip so everything fits on one line at normal widths. */}
        <ul className="ml-auto flex shrink-0 gap-0.5" aria-label="Items">
          {m.items.map((id, i) => (
            <li key={i} className="h-6 w-6 shrink-0 overflow-hidden rounded bg-panel-2">
              {id !== 0 && <img src={itemIcon(version, id)} alt={`Item ${id}`} className="h-full w-full" />}
            </li>
          ))}
        </ul>

        <button
          type="button"
          aria-label={open ? "Hide details" : "Details"}
          title={open ? "Hide details" : "Show details"}
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => setOpen((o) => !o)}
          className="flex w-8 shrink-0 items-center justify-center self-stretch rounded border border-line bg-panel-2 text-xs text-muted transition hover:text-white"
        >
          {open ? "▲" : "▼"}
        </button>
      </div>

      {open && (
        <div id={detailsId} className="mt-3">
          <MatchDetails match={m} version={version} />
        </div>
      )}
    </li>
  );
}
