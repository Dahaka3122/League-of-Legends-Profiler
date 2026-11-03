import { describe, expect, it } from "vitest";
import { formatDuration, formatPoints, formatTier, queueName, timeAgo } from "./format";

describe("formatDuration", () => {
  it("formats seconds as m:ss", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(1800)).toBe("30:00");
    expect(formatDuration(2465)).toBe("41:05");
  });
});

describe("timeAgo", () => {
  const now = 1_000_000_000_000;
  it("uses the largest sensible unit", () => {
    expect(timeAgo(now - 10_000, now)).toBe("just now");
    expect(timeAgo(now - 5 * 60_000, now)).toBe("5m ago");
    expect(timeAgo(now - 3 * 3_600_000, now)).toBe("3h ago");
    expect(timeAgo(now - 2 * 86_400_000, now)).toBe("2d ago");
    expect(timeAgo(now - 65 * 86_400_000, now)).toBe("2mo ago");
    expect(timeAgo(now - 800 * 86_400_000, now)).toBe("2y ago");
  });
  it("never goes negative for timestamps slightly in the future", () => {
    expect(timeAgo(now + 5000, now)).toBe("just now");
  });
});

describe("formatPoints", () => {
  it("abbreviates large numbers", () => {
    expect(formatPoints(950)).toBe("950");
    expect(formatPoints(12_400)).toBe("12k");
    expect(formatPoints(1_250_000)).toBe("1.3M");
  });
});

describe("formatTier", () => {
  it("title-cases the tier and appends the division when there is one", () => {
    expect(formatTier("GOLD", "II")).toBe("Gold II");
    expect(formatTier("EMERALD", "IV")).toBe("Emerald IV");
  });
  it("omits the division for apex tiers", () => {
    expect(formatTier("CHALLENGER", "I")).toBe("Challenger");
    expect(formatTier("GRANDMASTER", "I")).toBe("Grandmaster");
    expect(formatTier("MASTER", "I")).toBe("Master");
  });
});

describe("queueName", () => {
  it("maps known queue ids and falls back to the game mode", () => {
    expect(queueName(420, "CLASSIC")).toBe("Ranked Solo");
    expect(queueName(450, "ARAM")).toBe("ARAM");
    expect(queueName(1710, "CHERRY")).toBe("Arena");
  });
});
