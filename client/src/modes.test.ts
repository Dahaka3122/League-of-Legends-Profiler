import { describe, expect, it } from "vitest";
import { queueName } from "./format";
import { isArena, matchModeLabel, ordinal } from "./modes";

describe("ordinal", () => {
  it("handles 1st/2nd/3rd and the teens", () => {
    expect([1, 2, 3, 4, 8].map(ordinal)).toEqual(["1st", "2nd", "3rd", "4th", "8th"]);
    expect([11, 12, 13].map(ordinal)).toEqual(["11th", "12th", "13th"]);
    expect([21, 22, 23, 101, 111].map(ordinal)).toEqual(["21st", "22nd", "23rd", "101st", "111th"]);
  });
});

describe("isArena", () => {
  it("recognises Riot's CHERRY game mode only", () => {
    expect(isArena("CHERRY")).toBe(true);
    expect(isArena("CLASSIC")).toBe(false);
    expect(isArena("")).toBe(false);
  });
});

describe("matchModeLabel", () => {
  it("shows Arena for CHERRY even when the queue id is unknown", () => {
    expect(matchModeLabel(999_999, "CHERRY")).toBe("Arena");
  });
  it("prefers the queue-id name when the queue is known", () => {
    expect(matchModeLabel(420, "CLASSIC")).toBe(queueName(420, "CLASSIC"));
    expect(matchModeLabel(420, "CLASSIC")).not.toBe("CLASSIC");
  });
  it("falls back to a readable game-mode name, then to the raw code", () => {
    expect(matchModeLabel(999_999, "ARAM")).toBe("ARAM");
    expect(matchModeLabel(999_999, "ULTBOOK")).toBe("Ultimate Spellbook");
    expect(matchModeLabel(999_999, "SOMETHING_NEW")).toBe("SOMETHING_NEW");
  });
});
