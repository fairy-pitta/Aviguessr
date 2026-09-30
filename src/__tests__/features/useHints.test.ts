import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHints } from "@/features/hint-system";

describe("useHints", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function stubFetch(impl: () => Promise<Response>) {
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
      json: () => Promise.resolve({ level: 1, hint, penalty: 0.15 }),
    } as Response);

  const badRequest = () =>
    Promise.resolve({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: () => Promise.resolve({}),
    } as Response);

  it("test_use_hints_requests_nothing_until_a_hint_is_asked_for", async () => {
    // Hints used to unlock on a timer, which handed them over unasked
    const spy = stubFetch(() => ok("This bird lives in: Asia"));
    renderHook(() => useHints("game-1", 1));

    await act(async () => {
      vi.advanceTimersByTime(60000);
      await Promise.resolve();
    });

    expect(spy).not.toHaveBeenCalled();
  });

  it("test_reveal_hint_fetches_the_requested_level", async () => {
    const spy = stubFetch(() => ok("This bird lives in: Asia"));
    const { result } = renderHook(() => useHints("game-1", 1));

    await act(async () => {
      await result.current.revealHint(2);
    });

    expect(String(spy.mock.calls[0][0])).toContain("level=2");
    expect(result.current.hints[1]).toBe("This bird lives in: Asia");
  });

  it("test_reveal_hint_twice_for_the_same_level_fetches_once", async () => {
    const spy = stubFetch(() => ok("This bird lives in: Asia"));
    const { result } = renderHook(() => useHints("game-1", 1));

    await act(async () => {
      await result.current.revealHint(1);
    });
    await act(async () => {
      await result.current.revealHint(1);
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("test_reveal_hint_that_fails_can_be_asked_for_again", async () => {
    const spy = stubFetch(badRequest);
    const { result } = renderHook(() => useHints("game-1", 1));

    await act(async () => {
      await result.current.revealHint(1);
    });
    expect(result.current.hints[0]).toBeUndefined();

    await act(async () => {
      await result.current.revealHint(1);
    });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("test_use_hints_with_no_game_makes_no_request", async () => {
    const spy = stubFetch(() => ok("x"));
    const { result } = renderHook(() => useHints(null, 1));

    await act(async () => {
      await result.current.revealHint(1);
    });

    expect(spy).not.toHaveBeenCalled();
  });
})
