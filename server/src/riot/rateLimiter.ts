export interface RateLimit {
  max: number;
  windowMs: number;
}

export interface RateLimiterOptions {
  limits: RateLimit[];
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

export const DEV_KEY_LIMITS: RateLimit[] = [
  { max: 20, windowMs: 1_000 },
  { max: 100, windowMs: 120_000 },
];

export class RateLimiter {
  private readonly limits: RateLimit[];
  private readonly now: () => number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly timestamps: number[] = [];
  private queue: Promise<void> = Promise.resolve();
  private blockedUntil = 0;

  constructor(options: RateLimiterOptions) {
    this.limits = options.limits;
    this.now = options.now ?? Date.now;
    this.sleep = options.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  }

  blockFor(ms: number): void {
    this.blockedUntil = Math.max(this.blockedUntil, this.now() + ms);
  }

  acquire(): Promise<void> {
    const turn = this.queue.then(() => this.waitForSlot());
    this.queue = turn.catch(() => undefined);
    return turn;
  }

  private async waitForSlot(): Promise<void> {
    for (;;) {
      const now = this.now();
      const longest = Math.max(...this.limits.map((l) => l.windowMs));
      while (this.timestamps.length > 0 && now - this.timestamps[0]! >= longest) {
        this.timestamps.shift();
      }

      let waitMs = Math.max(0, this.blockedUntil - now);
      for (const { max, windowMs } of this.limits) {
        const inWindow = this.timestamps.filter((t) => now - t < windowMs);
        if (inWindow.length >= max) {
          const oldest = inWindow[0]!;
          waitMs = Math.max(waitMs, oldest + windowMs - now);
        }
      }

      if (waitMs <= 0) {
        this.timestamps.push(now);
        return;
      }
      await this.sleep(waitMs);
    }
  }
}
