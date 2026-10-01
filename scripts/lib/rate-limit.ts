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
