import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHints } from "@/features/hint-system";

describe("useHints", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function stubFetch(impl: () => Promise<Response>) {
    // Typed with fetch's parameters so the recorded URL can be read back
    const spy = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
      impl()
    );
    vi.stubGlobal("fetch", spy);
    return spy;
  }

  const ok = (hint: string) =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: "OK",
      json: () => Promise.resolve({ level: 1, hint }),
    } as Response);

  const badRequest = () =>
    Promise.resolve({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: () => Promise.resolve({}),
    } as Response);

  /**
   * Advance the clock in poll-sized steps, flushing promises between them.
   * Advancing in one jump runs every tick before the rejection is handled,
   * which hides the retry entirely.
   */
  async function tick(totalMs: number) {
    for (let elapsed = 0; elapsed < totalMs; elapsed += 500) {
      await act(async () => {
        vi.advanceTimersByTime(500);
        await Promise.resolve();
        await Promise.resolve();
      });
    }
  }

  it("test_use_hints_stops_requesting_a_level_the_server_keeps_rejecting", async () => {
    // A rejected hint was put back in the queue, so the poller retried it
    // twice a second for the rest of the round.
    const spy = stubFetch(badRequest);
    renderHook(() => useHints("game-1", 1, Date.now()));

    await tick(20000);

    // 3 thresholds pass in 20s; anything beyond a couple of attempts each is
    // the retry loop
    expect(spy.mock.calls.length).toBeLessThanOrEqual(6);
  });

  it("test_use_hints_never_requests_the_same_level_twice", async () => {
    const spy = stubFetch(() => ok("This bird lives in: Asia"));
    renderHook(() => useHints("game-1", 1, Date.now()));

    await tick(30000);

    const urls = spy.mock.calls.map((c) => String(c[0]));
    expect(urls.length).toBeGreaterThan(0);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("test_use_hints_gives_up_on_a_level_after_a_few_failures", async () => {
    const spy = stubFetch(badRequest);
    renderHook(() => useHints("game-1", 1, Date.now()));

    await tick(30000);

    const level1 = spy.mock.calls.filter((c) =>
      String(c[0]).includes("level=1")
    );
    expect(level1.length).toBeLessThanOrEqual(3);
  });

  it("test_use_hints_with_no_game_makes_no_requests", async () => {
    const spy = stubFetch(() => ok("x"));
    renderHook(() => useHints(null, 1, Date.now()));

    await tick(30000);

    expect(spy).not.toHaveBeenCalled();
  });
});
