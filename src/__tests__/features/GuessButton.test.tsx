import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GuessButton } from "@/features/guess-country";

describe("GuessButton", () => {
  it("test_render_without_selection_disables_submitting", () => {
    render(
      <GuessButton selectedCountry={null} loading={false} onGuess={vi.fn()} />
    );
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByText("Pick a country on the map")).toBeInTheDocument();
  });

  it("test_render_with_selection_names_the_chosen_country", () => {
    render(
      <GuessButton selectedCountry="JP" loading={false} onGuess={vi.fn()} />
    );
    expect(screen.getByRole("button")).toBeEnabled();
    expect(screen.getByText("Japan")).toBeInTheDocument();
  });

  it("test_render_while_loading_disables_and_says_submitting", () => {
    render(
      <GuessButton selectedCountry="JP" loading={true} onGuess={vi.fn()} />
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Submitting");
  });

  it("test_click_with_selection_calls_on_guess", () => {
    const onGuess = vi.fn();
    render(
      <GuessButton selectedCountry="JP" loading={false} onGuess={onGuess} />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onGuess).toHaveBeenCalledOnce();
  });
})
