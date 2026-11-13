import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ParticipantSummary, TeamSummary, MatchSummary } from "../types";
import { MatchComparison } from "./MatchComparison";

function fixture(overrides: Partial<MatchSummary> = {}): MatchSummary {
  return {
    matchId: "test", queueId: 420, gameMode: "CLASSIC", playedAt: 1, durationSec: 1200,
    win: true, championName: "Ahri", champLevel: 18, role: "MIDDLE", kills: 5, deaths: 2,
    assists: 5, kda: 5, cs: 120, csPerMin: 6, visionScore: 20, damage: 10000, gold: 10000,
    items: [], placement: null,
    participants: [{ isSelf: false, teamId: 200 }, { isSelf: true, teamId: 100 }] as ParticipantSummary[],
    teams: [{ teamId: 200, kills: 100, damage: 100000 }, { teamId: 100, kills: 20, damage: 40000 }] as TeamSummary[],
    ...overrides,
  };
}

afterEach(cleanup);

describe("MatchComparison", () => {
  it("renders an empty state", () => {
    render(<MatchComparison matches={[]} />);
    expect(screen.getByText(/At least two matches/)).toBeTruthy();
  });
  it("shows metrics and percentage-point changes, and switches queues", () => {
    render(<MatchComparison matches={[fixture({ playedAt: 4 }), fixture({ playedAt: 3, win: false, csPerMin: 4, visionScore: 10, kills: 0, assists: 0, damage: 0 }), fixture({ queueId: 450 })]} />);
    const row = screen.getByRole("row", { name: /Kill participation/ });
    expect(within(row).getByText("50.0%")).toBeTruthy();
    expect(within(row).getByText("+50.0 pp")).toBeTruthy();
    expect(screen.getByRole("row", { name: /CS\/min/ }).textContent).toContain("+2.0");
    fireEvent.change(screen.getByLabelText("Comparison queue"), { target: { value: "450" } });
    expect(screen.getByText(/At least two matches/)).toBeTruthy();
  });
  it("shows unavailable Arena metrics and explains the omitted match", () => {
    render(<MatchComparison matches={[fixture({ gameMode: "CHERRY" }), fixture({ gameMode: "CHERRY" }), fixture({ gameMode: "CHERRY" })]} />);
    expect(screen.getByRole("row", { name: /CS\/min/ }).textContent).toContain("N/A");
    expect(screen.getByText(/oldest match is excluded/)).toBeTruthy();
  });
  it("falls back to a valid queue when the profile changes", () => {
    const { rerender } = render(<MatchComparison matches={[fixture(), fixture()]} />);
    rerender(<MatchComparison matches={[fixture({ queueId: 450 }), fixture({ queueId: 450 })]} />);
    expect((screen.getByLabelText("Comparison queue") as HTMLSelectElement).value).toBe("450");
    expect(screen.getByRole("table")).toBeTruthy();
  });
});
