import { describe, expect, it } from "vitest";
import { MemoryCache } from "../src/cache.js";
import { fakeClock } from "./helpers.js";

describe("MemoryCache", () => {
  it("returns undefined for a missing key", async () => {
    const cache = new MemoryCache();
    expect(await cache.get("nope")).toBeUndefined();
  });

  it("returns a stored value until its TTL expires", async () => {
    const clock = fakeClock();
    const cache = new MemoryCache(clock.now);

    await cache.set("k", { a: 1 }, 1000);

    clock.advance(999);
    expect(await cache.get("k")).toEqual({ a: 1 });

    clock.advance(1);
    expect(await cache.get("k")).toBeUndefined();
  });

  it("overwrites an existing key and restarts its TTL", async () => {
    const clock = fakeClock();
    const cache = new MemoryCache(clock.now);

    await cache.set("k", "old", 1000);
    clock.advance(900);
    await cache.set("k", "new", 1000);
    clock.advance(900);

    expect(await cache.get("k")).toBe("new");
  });
});
