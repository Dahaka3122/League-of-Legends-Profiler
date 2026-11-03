import { describe, expect, it } from "vitest";
import { isPlatform, PLATFORMS, platformUrl, regionalHostFor, regionalUrl } from "../src/riot/regions.js";

describe("regions", () => {
  it("maps platforms to the correct regional routing host", () => {
    expect(regionalHostFor("euw1")).toBe("europe");
    expect(regionalHostFor("eun1")).toBe("europe");
    expect(regionalHostFor("na1")).toBe("americas");
    expect(regionalHostFor("kr")).toBe("asia");
    expect(regionalHostFor("oc1")).toBe("sea");
  });

  it("has a regional host for every platform", () => {
    for (const p of PLATFORMS) {
      expect(["americas", "asia", "europe", "sea"]).toContain(regionalHostFor(p));
    }
  });

  it("validates platform strings", () => {
    expect(isPlatform("euw1")).toBe(true);
    expect(isPlatform("euw")).toBe(false);
    expect(isPlatform("")).toBe(false);
  });

  it("builds hostnames", () => {
    expect(platformUrl("euw1")).toBe("https://euw1.api.riotgames.com");
    expect(regionalUrl("europe")).toBe("https://europe.api.riotgames.com");
  });
});
