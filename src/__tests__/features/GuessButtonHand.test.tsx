import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { GuessButton } from "@/features/guess-country";

describe("GuessButton handwriting", () => {
  it("test_render_with_selection_writes_the_answer_in_the_hand", () => {
    render(
      <GuessButton selectedCountry="JP" loading={false} onGuess={vi.fn()} />
    );
    expect(screen.getByText("Japan")).toHaveClass("handwritten");
  });

  it("test_render_without_selection_leaves_nothing_handwritten", () => {
    const { container } = render(
      <GuessButton selectedCountry={null} loading={false} onGuess={vi.fn()} />
    );
    expect(container.querySelector(".handwritten")).toBeNull();
  });
});
