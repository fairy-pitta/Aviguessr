/**
 * Pacing for a polite crawler.
 *
 * The naive shape — request, then sleep — spends the request's latency and the
 * politeness delay one after the other, so a 2.4 s round trip behind a 1.1 s
 * delay yields 17 requests a minute rather than the 55 the delay was chosen
 * for. The gate paces the moment each request *starts* instead, which lets
 * several be in flight at once without the host ever seeing a faster rate.
 *
 * A slot is reserved synchronously, before any await, so concurrent callers
 * cannot land on the same one. Returning the slot makes the pacing something a
 * test can assert on rather than something only a stopwatch can see.
 */
export type Clock = {
  now: () => number;
  sleep: (ms: number) => Promise<void>;
};

export const systemClock: Clock = {
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

/**
 * Returns a function that resolves when its caller may start, no sooner than
 * `minGapMs` after the previous caller started. Time spent idle is not banked:
 * a gate that has been quiet for a minute lets the next caller straight
 * through rather than releasing a burst.
 */
export function createGate(
  minGapMs: number,
  clock: Clock = systemClock
): () => Promise<number> {
  let nextSlot = -Infinity;

  return async () => {
    const slot = Math.max(nextSlot, clock.now());
    nextSlot = slot + minGapMs;

    const wait = slot - clock.now();
    if (wait > 0) await clock.sleep(wait);

    return slot;
  };
}

/**
 * A gate that finds the host's limit instead of assuming it.
 *
 * iNaturalist publishes 60 requests a minute but enforces something tighter
 * and apparently adaptive: a steady 48/min ran clean for an hour and was then
 * refused with `429 normal_throttling` for every subsequent request. A fixed
 * rate cannot be chosen safely against a limit that moves, so this widens the
 * gap on every refusal and eases it back down over a run of successes.
 *
 * The pause is global rather than per-request. When a host is refusing
 * everyone, retrying each failed item on its own backoff turns one refusal
 * into a storm of them, which is what kept the throttle engaged.
 */
export type AdaptiveGate = {
  wait: () => Promise<number>;
  throttled: (retryAfterMs?: number) => void;
  succeeded: () => void;
  gapMs: () => number;
};

export function createAdaptiveGate(opts: {
  startGapMs: number;
  minGapMs: number;
  maxGapMs: number;
  cooldownMs: number;
  /** Successes needed before the gap is allowed to narrow again. */
  easeAfter: number;
  clock?: Clock;
}): AdaptiveGate {
  const clock = opts.clock ?? systemClock;
  let gap = opts.startGapMs;
  let lastSlot = -Infinity;
  let pauseUntil = -Infinity;
  let streak = 0;

  return {
    gapMs: () => gap,

    throttled(retryAfterMs) {
      streak = 0;
      // Several requests are in flight, so one refusal arrives as several.
      // Widening once per episode keeps a single rejection from collapsing
      // the rate; a refusal after the pause has lapsed is a new episode and
      // widens again.
      const sameEpisode = clock.now() < pauseUntil;
      if (!sameEpisode) gap = Math.min(opts.maxGapMs, gap * 1.5);

      // A shorter pause must never shorten one already in force.
      pauseUntil = Math.max(
        pauseUntil,
        clock.now() + (retryAfterMs ?? opts.cooldownMs)
      );
    },

    succeeded() {
      if (++streak < opts.easeAfter) return;
      streak = 0;
      gap = Math.max(opts.minGapMs, gap * 0.9);
    },

    async wait() {
      // Spacing is measured from the last start against the gap in force
      // now, so a widening applies to the very next request rather than the
      // one after it.
      const slot = Math.max(lastSlot + gap, pauseUntil, clock.now());
      lastSlot = slot;

      const delay = slot - clock.now();
      if (delay > 0) await clock.sleep(delay);

      return slot;
    },
  };
}
