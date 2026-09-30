import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BirdCard } from "@/entities/bird";
import type { Bird } from "@/entities/bird";

describe("BirdCard", () => {
  const mockBird: Bird = {
    id: 1,
    name: "Jerdon's Minivet",
    family: "Cuckooshrikes",
    difficulty: "hard",
    imageUrl: "/api/birds/1/image",
    habitat: "Tropical & Subtropical Forest",
  };

  describe("while the round is being played", () => {
    it("test_render_before_reveal_hides_the_bird_name", () => {
      // Common names often name the place ("Tibetan Partridge"), which gives
      // the answer away
      render(<BirdCard bird={mockBird} />);
      expect(screen.queryByText("Jerdon's Minivet")).not.toBeInTheDocument();
    });

    it("test_render_before_reveal_hides_the_family", () => {
      render(<BirdCard bird={mockBird} />);
      expect(screen.queryByText("Cuckooshrikes")).not.toBeInTheDocument();
    });

    it("test_render_before_reveal_keeps_the_name_out_of_the_alt_text", () => {
      render(<BirdCard bird={mockBird} />);
      expect(screen.queryByAltText("Jerdon's Minivet")).not.toBeInTheDocument();
      expect(screen.getByAltText("Bird to identify")).toHaveAttribute(
        "src",
        "/api/birds/1/image"
      );
    });

    it("test_render_before_reveal_still_shows_the_habitat_clue", () => {
      render(<BirdCard bird={mockBird} />);
      expect(
        screen.getByText("Tropical & Subtropical Forest")
      ).toBeInTheDocument();
    });

    it("test_render_before_reveal_shows_the_difficulty_badge", () => {
      render(<BirdCard bird={mockBird} />);
      expect(screen.getByText("HARD")).toBeInTheDocument();
    });
  });

  describe("once the round is over", () => {
    it("test_render_when_revealed_shows_name_and_family", () => {
      render(<BirdCard bird={mockBird} revealed />);
      expect(screen.getByText("Jerdon's Minivet")).toBeInTheDocument();
      expect(screen.getByText("Cuckooshrikes")).toBeInTheDocument();
    });

    it("test_render_when_revealed_sets_alt_to_the_bird_name", () => {
      render(<BirdCard bird={mockBird} revealed />);
      expect(screen.getByAltText("Jerdon's Minivet")).toBeInTheDocument();
    });

    it("test_render_when_revealed_with_null_family_hides_family", () => {
      render(<BirdCard bird={{ ...mockBird, family: null }} revealed />);
      expect(screen.getByText("Jerdon's Minivet")).toBeInTheDocument();
      expect(screen.queryByText("Cuckooshrikes")).not.toBeInTheDocument();
    });
  });
});
