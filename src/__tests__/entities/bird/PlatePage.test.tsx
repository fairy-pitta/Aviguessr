import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlatePage } from "@/entities/bird";
import type { Bird } from "@/entities/bird";

describe("PlatePage", () => {
  const mockBird: Bird = {
    id: 1,
    name: "Jerdon's Minivet",
    family: "Cuckooshrikes",
    difficulty: "hard",
    imageUrl: "/api/birds/1/image",
    habitat: "Tropical & Subtropical Forest",
  };

  describe("while the question is open", () => {
    it("test_render_without_account_hides_the_bird_name", () => {
      // Common names often name the place ("Tibetan Partridge"), which is the
      // answer to the question being asked
      render(<PlatePage bird={mockBird} />);
      expect(screen.queryByText("Jerdon's Minivet")).not.toBeInTheDocument();
    });

    it("test_render_without_account_hides_the_family", () => {
      render(<PlatePage bird={mockBird} />);
      expect(screen.queryByText("Cuckooshrikes")).not.toBeInTheDocument();
    });

    it("test_render_without_account_keeps_the_name_out_of_the_alt_text", () => {
      render(<PlatePage bird={mockBird} />);
      expect(screen.queryByAltText("Jerdon's Minivet")).not.toBeInTheDocument();
      expect(screen.getByAltText("Bird to identify")).toHaveAttribute(
        "src",
        "/api/birds/1/image"
      );
    });

    it("test_render_without_account_asks_the_question", () => {
      render(<PlatePage bird={mockBird} />);
      expect(
        screen.getByText("Where does this bird live?")
      ).toBeInTheDocument();
    });

    it("test_render_without_account_still_shows_the_habitat_clue", () => {
      render(<PlatePage bird={mockBird} />);
      expect(
        screen.getByText("Tropical & Subtropical Forest")
      ).toBeInTheDocument();
    });

    it("test_render_with_no_habitat_omits_the_caption_line", () => {
      render(<PlatePage bird={{ ...mockBird, habitat: undefined }} />);
      expect(
        screen.getByText("Where does this bird live?")
      ).toBeInTheDocument();
    });
  });

  describe("once the round is over", () => {
    it("test_render_with_account_shows_it_instead_of_the_question", () => {
      render(<PlatePage bird={mockBird} account={<p>Jerdon's Minivet</p>} />);
      expect(screen.getByText("Jerdon's Minivet")).toBeInTheDocument();
      expect(
        screen.queryByText("Where does this bird live?")
      ).not.toBeInTheDocument();
    });

    it("test_render_with_account_sets_alt_to_the_bird_name", () => {
      render(<PlatePage bird={mockBird} account={<p>account</p>} />);
      expect(screen.getByAltText("Jerdon's Minivet")).toBeInTheDocument();
    });
  });
});
