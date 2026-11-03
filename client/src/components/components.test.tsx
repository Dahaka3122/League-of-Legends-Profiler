import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MatchSummary, ParticipantSummary, RankedInfo, TeamSummary } from "../types";
import { MatchCard } from "./MatchCard";
import { MatchList } from "./MatchList";
import { RankedCard } from "./RankedCard";
import { SearchBar } from "./SearchBar";

afterEach(cleanup);

const match = (overrides: Partial<MatchSummary> = {}): MatchSummary => ({
  matchId: "EUW1_1",
  queueId: 420,
  gameMode: "CLASSIC",
  playedAt: 1_000_000,
  durationSec: 1865,
  win: true,
  championName: "Ahri",
  champLevel: 16,
  role: "MIDDLE",
  kills: 10,
  deaths: 2,
  assists: 5,
  kda: 7.5,
  cs: 200,
  csPerMin: 6.67,
  visionScore: 25,
  damage: 24000,
  gold: 13000,
  items: [1055, 3020, 0, 0, 0, 0, 3340],
  placement: null,
  teams: [
    { teamId: 100, placement: null, win: true, kills: 16, deaths: 6, assists: 17, gold: 35000, damage: 50000 },
    { teamId: 200, placement: null, win: false, kills: 2, deaths: 13, assists: 5, gold: 15000, damage: 10000 },
  ],
  participants: [
    player({ name: "Tester", isSelf: true, teamId: 100, win: true, role: "MIDDLE", damage: 30000, damageShare: 60 }),
    player({ name: "BlueTop", teamId: 100, win: true, role: "TOP", championName: "Garen", damage: 10000, damageShare: 20 }),
    player({ name: "RedSup", teamId: 200, win: false, role: "UTILITY", championName: "Lulu", damage: 2000, damageShare: 20 }),
  ],
  ...overrides,
});

function player(overrides: Partial<ParticipantSummary> = {}): ParticipantSummary {
  return {
    name: "Someone",
    tag: "EUW",
    isSelf: false,
    championName: "Ahri",
    champLevel: 16,
    teamId: 100,
    placement: null,
    role: "MIDDLE",
    win: true,
    kills: 5,
    deaths: 2,
    assists: 3,
    kda: 4,
    cs: 150,
    visionScore: 20,
    damage: 10000,
    damageShare: 25,
    gold: 12000,
    items: [1055, 0, 0, 0, 0, 0, 3340],
    ...overrides,
  };
}

describe("MatchCard", () => {
  it("shows result, KDA, queue, duration and champion icon for a win", () => {
    render(
      <ul>
        <MatchCard match={match()} version="14.20.1" now={1_000_000 + 2 * 3_600_000} />
      </ul>,
    );

    expect(screen.getByText("Victory")).toBeTruthy();
    expect(screen.getByText("Ranked Solo")).toBeTruthy();
    expect(screen.getByText("31:05")).toBeTruthy();
    expect(screen.getByText("2h ago")).toBeTruthy();
    expect(screen.getByText("7.50 KDA")).toBeTruthy();
    expect(screen.getByText("200 CS (6.7/min)")).toBeTruthy();

    const icon = screen.getByAltText("Ahri") as HTMLImageElement;
    expect(icon.src).toBe("https://ddragon.leagueoflegends.com/cdn/14.20.1/img/champion/Ahri.png");
  });

  it("shows Defeat for a loss", () => {
    render(
      <ul>
        <MatchCard match={match({ win: false })} version="14.20.1" />
      </ul>,
    );
    expect(screen.getByText("Defeat")).toBeTruthy();
  });

  it("renders item icons only for filled slots", () => {
    render(
      <ul>
        <MatchCard match={match()} version="14.20.1" />
      </ul>,
    );
    // 3 non-empty slots: 1055, 3020, 3340
    expect(screen.getAllByAltText(/^Item \d+$/)).toHaveLength(3);
  });
});

describe("MatchCard details panel", () => {
  const renderCard = () =>
    render(
      <ul>
        <MatchCard match={match()} version="14.20.1" />
      </ul>,
    );

  it("starts collapsed: no player tables, toggle says Details", () => {
    renderCard();
    expect(screen.queryByText("BlueTop")).toBeNull();
    const toggle = screen.getByRole("button", { name: /Details/ });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("expands to show both teams, then collapses again", () => {
    renderCard();

    fireEvent.click(screen.getByRole("button", { name: /Details/ }));

    expect(screen.getByText("BlueTop")).toBeTruthy();
    expect(screen.getByText("RedSup")).toBeTruthy();
    expect(screen.getAllByRole("table")).toHaveLength(2); // one table per team
    const toggle = screen.getByRole("button", { name: /Hide/ });
    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(toggle);

    expect(screen.queryByText("BlueTop")).toBeNull();
    expect(screen.getByRole("button", { name: /Details/ }).getAttribute("aria-expanded")).toBe("false");
  });

  it("highlights only the profile owner's row and shows damage share", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: /Details/ }));

    const current = screen.getAllByRole("row").filter((r) => r.getAttribute("aria-current") === "true");
    expect(current).toHaveLength(1);
    expect(current[0]?.textContent).toContain("Tester");
    expect(current[0]?.textContent).toContain("(60%)");
  });

  it("shows team totals with the right result label", () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: /Details/ }));

    const captions = screen.getAllByRole("table").map((t) => t.querySelector("caption")?.textContent ?? "");
    expect(captions[0]).toContain("Victory");
    expect(captions[0]).toContain("16 / 6 / 17");
    expect(captions[1]).toContain("Defeat");
    expect(captions[1]).toContain("2 / 13 / 5");
  });
});

describe("Arena matches", () => {
  const duoTeam = (teamId: number, placement: number, win: boolean): TeamSummary => ({
    teamId, placement, win, kills: 6, deaths: 2, assists: 4, gold: 10000, damage: 8000,
  });
  // queueId 9999 is deliberately unknown: Arena must be recognised from the game mode alone.
  const arenaMatch = (): MatchSummary =>
    match({
      queueId: 9999,
      gameMode: "CHERRY",
      placement: 1,
      teams: [duoTeam(2, 1, true), duoTeam(4, 2, true), duoTeam(1, 3, false)],
      participants: [
        player({ name: "Tester", isSelf: true, teamId: 2, placement: 1, role: "" }),
        player({ name: "Partner", teamId: 2, placement: 1, role: "" }),
        player({ name: "DuoD1", teamId: 4, placement: 2, role: "", win: true }),
        player({ name: "DuoD2", teamId: 4, placement: 2, role: "", win: true }),
        player({ name: "DuoA1", teamId: 1, placement: 3, role: "", win: false }),
        player({ name: "DuoA2", teamId: 1, placement: 3, role: "", win: false }),
      ],
    });

  const renderArena = () =>
    render(
      <ul>
        <MatchCard match={arenaMatch()} version="14.20.1" />
      </ul>,
    );

  it("labels the mode 'Arena' (never the raw CHERRY code) even for an unknown queue id", () => {
    renderArena();
    expect(screen.getByText("Arena")).toBeTruthy();
    expect(screen.queryByText("CHERRY")).toBeNull();
  });

  it("shows the player's placement on the card and hides CS / vision", () => {
    renderArena();
    expect(screen.getByText("1st place")).toBeTruthy();
    expect(screen.queryByText(/CS \(/)).toBeNull();
    expect(screen.queryByText(/^Vision/)).toBeNull();
  });

  it("splits the details into one table per duo, headed by placement, best first", () => {
    renderArena();
    fireEvent.click(screen.getByRole("button", { name: /Details/ }));

    const tables = screen.getAllByRole("table");
    expect(tables).toHaveLength(3);
    const captions = tables.map((t) => t.querySelector("caption")?.textContent ?? "");
    expect(captions[0]).toContain("1st place");
    expect(captions[1]).toContain("2nd place");
    expect(captions[2]).toContain("3rd place");
    expect(tables[0]?.textContent).toContain("Partner");
    expect(tables[2]?.textContent).toContain("DuoA1");
  });

  it("drops the CS and Vision columns in Arena but keeps them elsewhere", () => {
    renderArena();
    fireEvent.click(screen.getByRole("button", { name: /Details/ }));
    expect(screen.queryAllByRole("columnheader", { name: "CS" })).toHaveLength(0);
    expect(screen.queryAllByRole("columnheader", { name: "Vision" })).toHaveLength(0);
    cleanup();

    render(
      <ul>
        <MatchCard match={match()} version="14.20.1" />
      </ul>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Details/ }));
    expect(screen.getAllByRole("columnheader", { name: "CS" })).toHaveLength(2);
    expect(screen.getAllByRole("columnheader", { name: "Vision" })).toHaveLength(2);
  });
});

describe("MatchList", () => {
  it("summarizes wins and losses", () => {
    render(
      <MatchList
        version="14.20.1"
        matches={[match({ matchId: "a" }), match({ matchId: "b", win: false }), match({ matchId: "c" })]}
      />,
    );
    expect(screen.getByText("2W")).toBeTruthy();
    expect(screen.getByText("1L")).toBeTruthy();
  });

  it("shows an empty state", () => {
    render(<MatchList version="14.20.1" matches={[]} />);
    expect(screen.getByText("No recent matches")).toBeTruthy();
  });
});

describe("RankedCard", () => {
  it("shows tier, LP and win rate", () => {
    const ranked: RankedInfo[] = [
      { queue: "SOLO", tier: "GOLD", rank: "II", lp: 45, wins: 60, losses: 40, winrate: 60 },
    ];
    render(<RankedCard ranked={ranked} />);

    expect(screen.getByText("Gold II")).toBeTruthy();
    expect(screen.getByText("Ranked Solo/Duo")).toBeTruthy();
    expect(screen.getByText(/45 LP/)).toBeTruthy();
    expect(screen.getByText("60%")).toBeTruthy();
  });

  it("shows unranked when there are no entries", () => {
    render(<RankedCard ranked={[]} />);
    expect(screen.getByText("Unranked this season")).toBeTruthy();
  });
});

describe("SearchBar", () => {
  it("submits the selected region and parsed Riot ID", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    fireEvent.change(screen.getByLabelText("Region"), { target: { value: "kr" } });
    fireEvent.change(screen.getByLabelText("Riot ID"), { target: { value: "Hide on bush#KR1" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(onSearch).toHaveBeenCalledWith("kr", "Hide on bush", "KR1");
  });

  it("shows a validation error and does not search when the tag is missing", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    fireEvent.change(screen.getByLabelText("Riot ID"), { target: { value: "Faker" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(screen.getByRole("alert").textContent).toBe("Enter a Riot ID like Name#TAG");
    expect(onSearch).not.toHaveBeenCalled();
  });
});
