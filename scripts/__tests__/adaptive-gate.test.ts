import { describe, it, expect } from "vitest";
import { createAdaptiveGate, type Clock } from "../lib/rate-limit";

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

const opts = (clock: Clock) => ({
  startGapMs: 1000,
  minGapMs: 500,
  maxGapMs: 4000,
  cooldownMs: 30_000,
  easeAfter: 3,
  clock,
});

describe("createAdaptiveGate", () => {
  it("test_gate_widens_the_gap_when_throttled", async () => {
    const { clock } = fakeClock();
    const gate = createAdaptiveGate(opts(clock));

    expect(gate.gapMs()).toBe(1000);
    gate.throttled();

    expect(gate.gapMs()).toBe(1500);
  });

  it("test_gate_widening_stops_at_the_maximum", async () => {
    const { clock, set } = fakeClock();
    const gate = createAdaptiveGate(opts(clock));

    for (let i = 0; i < 20; i++) {
      set(i * 60_000);
      gate.throttled();
    }

    expect(gate.gapMs()).toBe(4000);
  });

  it("test_gate_ignores_a_second_refusal_inside_the_same_pause", async () => {
    const { clock } = fakeClock();
    const gate = createAdaptiveGate(opts(clock));

    gate.throttled();
    gate.throttled();
    gate.throttled();

    expect(gate.gapMs()).toBe(1500);
  });

  it("test_gate_widens_again_once_the_pause_has_lapsed", async () => {
    const { clock, set } = fakeClock();
    const gate = createAdaptiveGate(opts(clock));

    gate.throttled();
    set(60_000);
    gate.throttled();

    expect(gate.gapMs()).toBe(2250);
  });

  it("test_gate_holds_every_caller_until_the_cooldown_passes", async () => {
    const { clock } = fakeClock();
    const gate = createAdaptiveGate(opts(clock));

    gate.throttled();
    const slots = await Promise.all([gate.wait(), gate.wait()]);

    expect(slots[0]).toBe(30_000);
    expect(slots[1]).toBe(31_500);
  });

  it("test_gate_honours_a_retry_after_longer_than_the_cooldown", async () => {
    const { clock } = fakeClock();
    const gate = createAdaptiveGate(opts(clock));

    gate.throttled(90_000);

    expect(await gate.wait()).toBe(90_000);
  });

  it("test_gate_keeps_the_longer_pause_when_throttled_again_sooner", async () => {
    const { clock } = fakeClock();
    const gate = createAdaptiveGate(opts(clock));

    gate.throttled(90_000);
    gate.throttled(1_000);

    expect(await gate.wait()).toBe(90_000);
  });

  it("test_gate_narrows_the_gap_after_a_run_of_successes", async () => {
    const { clock } = fakeClock();
    const gate = createAdaptiveGate(opts(clock));

    gate.throttled();
    expect(gate.gapMs()).toBe(1500);

    gate.succeeded();
    gate.succeeded();
    expect(gate.gapMs()).toBe(1500);
    gate.succeeded();

    expect(gate.gapMs()).toBe(1350);
  });

  it("test_gate_narrowing_stops_at_the_minimum", async () => {
    const { clock } = fakeClock();
    const gate = createAdaptiveGate(opts(clock));

    for (let i = 0; i < 300; i++) gate.succeeded();

    expect(gate.gapMs()).toBe(500);
  });

  it("test_gate_spaces_callers_by_the_current_gap", async () => {
    const { clock } = fakeClock();
    const gate = createAdaptiveGate(opts(clock));

    expect(await gate.wait()).toBe(0);
    expect(await gate.wait()).toBe(1000);
    gate.throttled(0);

    expect(await gate.wait()).toBe(2500);
  });
});
