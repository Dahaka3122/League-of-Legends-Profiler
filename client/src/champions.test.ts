import { describe, expect, it } from "vitest";
import { championIconId } from "./champions";

describe("championIconId", () => {
  it("fixes names where match data and Data Dragon disagree on spelling", () => {
    expect(championIconId("FiddleSticks")).toBe("Fiddlesticks");
  });
  it("leaves every other champion name alone", () => {
    expect(championIconId("Ahri")).toBe("Ahri");
    expect(championIconId("MonkeyKing")).toBe("MonkeyKing"); // Wukong's real Data Dragon id
  });
});
