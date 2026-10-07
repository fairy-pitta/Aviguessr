import { describe, it, expect } from "vitest";
import { createGate, type Clock } from "../lib/rate-limit";

/**
 * A clock that reports a time we control and records what it was asked to
 * wait for, so pacing can be asserted without spending the time.
 */
function fakeClock() {
  let t = 0;
  const waits: number[] = [];
  const clock: Clock = {
    now: () => t,
    sleep: async (ms) => {
      waits.push(ms);
      t += ms;
    },
  };
  return { clock, waits, set: (ms: number) => (t = ms) };
}

describe("createGate", () => {
  it("test_gate_first_call_waits_for_nothing", async () => {
    const { clock, waits } = fakeClock();
    const gate = createGate(1100, clock);

    expect(await gate()).toBe(0);
    expect(waits).toEqual([]);
  });

  it("test_gate_sequential_calls_are_spaced_by_the_gap", async () => {
    const { clock } = fakeClock();
    const gate = createGate(1100, clock);

    expect(await gate()).toBe(0);
    expect(await gate()).toBe(1100);
    expect(await gate()).toBe(2200);
  });

  it("test_gate_concurrent_calls_each_reserve_a_distinct_slot", async () => {
    const { clock } = fakeClock();
    const gate = createGate(1100, clock);

    const slots = await Promise.all([gate(), gate(), gate(), gate()]);

    expect(slots).toEqual([0, 1100, 2200, 3300]);
  });

  it("test_gate_after_a_long_pause_starts_at_once_without_catching_up", async () => {
    const { clock, waits, set } = fakeClock();
    const gate = createGate(1100, clock);

    await gate();
    set(60_000);

    expect(await gate()).toBe(60_000);
    expect(waits).toEqual([]);
  });

  it("test_gate_with_a_zero_gap_never_waits", async () => {
    const { clock, waits } = fakeClock();
    const gate = createGate(0, clock);

    await Promise.all([gate(), gate(), gate()]);

    expect(waits).toEqual([]);
  });
});
