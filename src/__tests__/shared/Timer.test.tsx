import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { Timer } from "@/shared/ui";
import { TIME_LIMIT_MS } from "@/shared/config/constants";

describe("Timer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("test_timer_past_the_limit_calls_on_timeout_exactly_once", () => {
    // The tick ran every 100ms and fired onTimeout on every tick once the
    // limit passed, so one round submitted a guess ten times a second.
    const onTimeout = vi.fn();
    render(<Timer startTime={Date.now()} onTimeout={onTimeout} />);

    vi.advanceTimersByTime(TIME_LIMIT_MS + 3000);

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("test_timer_before_the_limit_does_not_call_on_timeout", () => {
    const onTimeout = vi.fn();
    render(<Timer startTime={Date.now()} onTimeout={onTimeout} />);

    vi.advanceTimersByTime(TIME_LIMIT_MS - 500);

    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("test_timer_when_paused_does_not_call_on_timeout", () => {
    const onTimeout = vi.fn();
    render(<Timer startTime={Date.now()} onTimeout={onTimeout} paused />);

    vi.advanceTimersByTime(TIME_LIMIT_MS + 3000);

    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("test_timer_with_a_new_start_time_can_fire_again_for_the_next_round", () => {
    const onTimeout = vi.fn();
    const { rerender } = render(
      <Timer startTime={Date.now()} onTimeout={onTimeout} />
    );
    vi.advanceTimersByTime(TIME_LIMIT_MS + 1000);
    expect(onTimeout).toHaveBeenCalledTimes(1);

    rerender(<Timer startTime={Date.now()} onTimeout={onTimeout} />);
    vi.advanceTimersByTime(TIME_LIMIT_MS + 1000);

    expect(onTimeout).toHaveBeenCalledTimes(2);
  });
});
