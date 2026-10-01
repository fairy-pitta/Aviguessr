import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { BookSpread, TURN_MS, LIFT_MS } from "@/shared/ui";

function stubMotion(reduced: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduced,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

describe("BookSpread", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stubMotion(false);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("test_render_shows_both_pages", () => {
    render(<BookSpread turnKey={1} left={<p>plate one</p>} right={<p>map one</p>} />);
    expect(screen.getByText("plate one")).toBeInTheDocument();
    expect(screen.getByText("map one")).toBeInTheDocument();
  });

  it("test_turn_key_change_keeps_the_outgoing_left_page_until_the_turn_ends", () => {
    const { rerender } = render(
      <BookSpread turnKey={1} left={<p>plate one</p>} right={<p>map one</p>} />
    );
    rerender(
      <BookSpread turnKey={2} left={<p>plate two</p>} right={<p>map two</p>} />
    );

    // The leaf has not landed, so the page under it is still the old one
    expect(screen.getByText("plate one")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(TURN_MS);
    });
    expect(screen.queryByText("plate one")).not.toBeInTheDocument();
    expect(screen.getByText("plate two")).toBeInTheDocument();
  });

  it("test_turn_key_change_swaps_the_right_page_once_the_leaf_has_covered_it", () => {
    const { rerender } = render(
      <BookSpread turnKey={1} left={<p>plate one</p>} right={<p>map one</p>} />
    );
    rerender(
      <BookSpread turnKey={2} left={<p>plate two</p>} right={<p>map two</p>} />
    );

    // Still visible through the lifting leaf, so it must not have swapped yet
    expect(screen.getByText("map one")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(LIFT_MS);
    });
    expect(screen.queryByText("map one")).not.toBeInTheDocument();
    expect(screen.getByText("map two")).toBeInTheDocument();
  });

  it("test_turn_key_change_with_reduced_motion_swaps_both_pages_at_once", () => {
    stubMotion(true);
    const { rerender } = render(
      <BookSpread turnKey={1} left={<p>plate one</p>} right={<p>map one</p>} />
    );
    rerender(
      <BookSpread turnKey={2} left={<p>plate two</p>} right={<p>map two</p>} />
    );
    expect(screen.queryByText("plate one")).not.toBeInTheDocument();
    expect(screen.getByText("plate two")).toBeInTheDocument();
    expect(screen.getByText("map two")).toBeInTheDocument();
  });
});
