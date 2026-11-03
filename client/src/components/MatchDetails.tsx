import { championIcon, itemIcon } from "../ddragon";
import { isArena, ordinal } from "../modes";
import type { MatchSummary, ParticipantSummary, TeamSummary } from "../types";

const ROLE_LABEL: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "ADC",
  UTILITY: "Support",
};

const fmt = (n: number) => n.toLocaleString("en-US");
const fmtGold = (g: number) => `${(g / 1000).toFixed(1)}k`;

interface Props {
  match: MatchSummary;
  version: string;
}

export function MatchDetails({ match, version }: Props) {
  // Bars are scaled to the highest damage in the whole game so teams are comparable.
  const maxDamage = Math.max(1, ...match.participants.map((p) => p.damage));
  const arena = isArena(match.gameMode);

  return (
    <div className="space-y-4 border-t border-line pt-3" role="region" aria-label="Match details">
      {match.teams.map((team) => (
        <TeamTable
          key={team.teamId}
          team={team}
          players={match.participants.filter((p) => p.teamId === team.teamId)}
          maxDamage={maxDamage}
          version={version}
          arena={arena}
        />
      ))}
    </div>
  );
}

interface TeamTableProps {
  team: TeamSummary;
  players: ParticipantSummary[];
  maxDamage: number;
  version: string;
  arena: boolean;
}

function TeamTable({ team, players, maxDamage, version, arena }: TeamTableProps) {
  // In Arena each table is a duo, headed by where the duo finished. Elsewhere it is a team.
  const heading = arena && team.placement != null ? `${ordinal(team.placement)} place` : team.win ? "Victory" : "Defeat";

  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-left text-xs ${arena ? "min-w-[32rem]" : "min-w-[40rem]"}`}>
        <caption className="mb-1 text-left">
          <span className={`font-bold ${team.win ? "text-win" : "text-loss"}`}>{heading}</span>
          <span className="ml-2 text-muted">
            {team.kills} / {team.deaths} / {team.assists} · {fmtGold(team.gold)} gold · {fmt(team.damage)} dmg
          </span>
        </caption>
        <thead className="text-muted">
          <tr>
            <th scope="col" className="py-1 pr-2 font-normal">Player</th>
            <th scope="col" className="px-2 font-normal">KDA</th>
            <th scope="col" className="px-2 font-normal">Damage</th>
            {!arena && <th scope="col" className="px-2 font-normal">CS</th>}
            {!arena && <th scope="col" className="px-2 font-normal">Vision</th>}
            <th scope="col" className="px-2 font-normal">Gold</th>
            <th scope="col" className="pl-2 font-normal">Items</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr
              key={`${p.name}-${p.tag}-${i}`}
              aria-current={p.isSelf ? "true" : undefined}
              className={p.isSelf ? "bg-white/10" : ""}
            >
              <td className="py-1 pr-2">
                <div className="flex items-center gap-2">
                  <img src={championIcon(version, p.championName)} alt={p.championName} className="h-8 w-8 shrink-0 rounded" />
                  <div className="min-w-0">
                    <p className={`truncate font-semibold ${p.isSelf ? "text-gold" : ""}`}>{p.name}</p>
                    <p className="text-[10px] text-muted">{ROLE_LABEL[p.role] ?? p.championName}</p>
                  </div>
                </div>
              </td>
              <td className="px-2 whitespace-nowrap">
                {p.kills}/{p.deaths}/{p.assists}
                <span className="ml-1 text-muted">({p.kda.toFixed(2)})</span>
              </td>
              <td className="px-2">
                <div className="w-28">
                  <p>
                    {fmt(p.damage)} <span className="text-muted">({p.damageShare}%)</span>
                  </p>
                  <div className="mt-0.5 h-1.5 rounded-full bg-panel-2" aria-hidden>
                    <div
                      className={`h-full rounded-full ${team.win ? "bg-win" : "bg-loss"}`}
                      style={{ width: `${(p.damage / maxDamage) * 100}%` }}
                    />
                  </div>
                </div>
              </td>
              {!arena && <td className="px-2">{p.cs}</td>}
              {!arena && <td className="px-2">{p.visionScore}</td>}
              <td className="px-2 whitespace-nowrap">{fmtGold(p.gold)}</td>
              {/* Items: fixed-size slots that never shrink. Without shrink-0 the flex row
                  squeezes the icons together when the table is narrow, so they overlap. */}
              <td className="pl-2">
                <div className="flex w-max gap-0.5">
                  {p.items.map((id, idx) => (
                    <span key={idx} className="h-6 w-6 shrink-0 overflow-hidden rounded bg-panel-2">
                      {id !== 0 && <img src={itemIcon(version, id)} alt={`Item ${id}`} className="h-full w-full" />}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
