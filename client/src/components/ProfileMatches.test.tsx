import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchMatches } from "../api";
import type { MatchSummary, Profile } from "../types";
import { ProfileMatches } from "./ProfileMatches";

vi.mock("../api", () => ({ fetchMatches: vi.fn() }));
const dd = { version: "test", championById: {} };
const match = (i: number): MatchSummary => ({
  matchId: `m${i}`, queueId: 420, gameMode: "CLASSIC", playedAt: 1000 - i, durationSec: 1200,
  win: true, championName: "Ahri", champLevel: 18, role: "MIDDLE", kills: 5, deaths: 2,
  assists: 5, kda: 5, cs: 120, csPerMin: 6, visionScore: 20, damage: 10000, gold: 10000,
  items: [], placement: null, participants: [], teams: [],
});
const page = (start: number, count = 10) => Array.from({ length: count }, (_, i) => match(start + i));
const profile: Profile = { region: "euw1", puuid: "p1", gameName: "Tester", tagLine: "EUW", level: 1, profileIconId: 1, ranked: [], topMastery: [], matches: page(0), nextStart: 10 };
afterEach(() => { cleanup(); vi.resetAllMocks(); });

describe("ProfileMatches", () => {
  it("appends ten matches and updates the comparison", async () => {
    vi.mocked(fetchMatches).mockResolvedValue({ matches: page(10), nextStart: 20 });
    render(<ProfileMatches profile={profile} dd={dd} />);
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    await screen.findByText(/Latest 10 vs previous 10/);
    expect(screen.getAllByRole("button", { name: "Details" })).toHaveLength(20);
    expect(fetchMatches).toHaveBeenCalledWith("euw1", "p1", 10, expect.any(AbortSignal));
  });
  it("blocks repeated clicks, retains history on failure and retries the same offset", async () => {
    let reject!: (error: Error) => void;
    vi.mocked(fetchMatches).mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail; }))
      .mockResolvedValueOnce({ matches: page(10, 3), nextStart: null });
    render(<ProfileMatches profile={profile} dd={dd} />);
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    const loading = screen.getByRole("button", { name: "Loading…" }) as HTMLButtonElement;
    expect(loading.disabled).toBe(true);
    fireEvent.click(loading);
    expect(fetchMatches).toHaveBeenCalledTimes(1);
    reject(new Error("Try again"));
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Try again");
    expect(screen.getAllByRole("button", { name: "Details" })).toHaveLength(10);
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    await screen.findByText("No more matches.");
    expect(fetchMatches).toHaveBeenLastCalledWith("euw1", "p1", 10, expect.any(AbortSignal));
    expect(screen.getAllByRole("button", { name: "Details" })).toHaveLength(13);
  });
  it("deduplicates overlapping pages and reaches the 100-match limit", async () => {
    vi.mocked(fetchMatches).mockResolvedValueOnce({ matches: [match(9), ...page(10, 9)], nextStart: 20 });
    const { unmount } = render(<ProfileMatches profile={profile} dd={dd} />);
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Details" })).toHaveLength(19));
    unmount();
    vi.mocked(fetchMatches).mockResolvedValueOnce({ matches: page(90), nextStart: null });
    render(<ProfileMatches profile={{ ...profile, matches: page(0, 90), nextStart: 90 }} dd={dd} />);
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    await screen.findByText("History limit reached (100 matches).");
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "Details" })).toHaveLength(100);
  });
  it("aborts an old request and resets history when the profile key changes", async () => {
    let resolve!: (value: Awaited<ReturnType<typeof fetchMatches>>) => void;
    vi.mocked(fetchMatches).mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    const { rerender } = render(<ProfileMatches key="p1" profile={profile} dd={dd} />);
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    const signal = vi.mocked(fetchMatches).mock.calls[0]?.[3];
    rerender(<ProfileMatches key="p2" profile={{ ...profile, puuid: "p2" }} dd={dd} />);
    expect(signal?.aborted).toBe(true);
    resolve({ matches: page(10), nextStart: null });
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Details" })).toHaveLength(10));
    expect(screen.getByRole("button", { name: "Load more" })).toBeTruthy();
  });
});
