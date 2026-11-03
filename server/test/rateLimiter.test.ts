import { describe, expect, it } from "vitest";
import { RateLimiter } from "../src/riot/rateLimiter.js";
import { fakeClock } from "./helpers.js";

describe("RateLimiter", () => {
  it("lets requests through immediately while under the limit", async () => {
    const clock = fakeClock();
    const limiter = new RateLimiter({ limits: [{ max: 3, windowMs: 1000 }], ...clock });

    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();

    expect(clock.now()).toBe(0);
  });

  it("makes the request over the limit wait until the window frees up", async () => {
    const clock = fakeClock();
    const limiter = new RateLimiter({ limits: [{ max: 2, windowMs: 1000 }], ...clock });

    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire(); // 3rd must wait for the 1st to age out

    expect(clock.now()).toBe(1000);
  });

  it("enforces every window, not just the shortest one", async () => {
    const clock = fakeClock();
    const limiter = new RateLimiter({
      limits: [
        { max: 100, windowMs: 1000 },
        { max: 2, windowMs: 10_000 },
      ],
      ...clock,
    });

    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();

    expect(clock.now()).toBe(10_000);
  });

  it("serves concurrent callers in order without exceeding the limit", async () => {
    const clock = fakeClock();
    const limiter = new RateLimiter({ limits: [{ max: 2, windowMs: 1000 }], ...clock });
    const order: number[] = [];

    await Promise.all(
      [0, 1, 2, 3, 4].map(async (i) => {
        await limiter.acquire();
        order.push(i);
      }),
    );

    // First-come, first-served, and 5 requests at 2 per second need 2 full waits.
    expect(order).toEqual([0, 1, 2, 3, 4]);
    expect(clock.now()).toBe(2000);
  });

  it("blockFor() pauses callers, e.g. after a 429 Retry-After", async () => {
    const clock = fakeClock();
    const limiter = new RateLimiter({ limits: [{ max: 10, windowMs: 1000 }], ...clock });

    limiter.blockFor(2500);
    await limiter.acquire();

    expect(clock.now()).toBe(2500);
  });
});
