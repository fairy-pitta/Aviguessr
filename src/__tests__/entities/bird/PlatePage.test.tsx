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
    it("test_render_without_account_names_the_species", () => {
      // Two quetzals are the same photograph to anyone but a specialist and
      // live a continent apart, so the name is what makes the round fair.
      // Where a name would give the answer away the server inks the place
      // out before it ever reaches here.
      render(<PlatePage bird={mockBird} />);
      expect(screen.getByText("Jerdon's Minivet")).toBeInTheDocument();
    });

    it("test_render_without_account_hides_the_family", () => {
      render(<PlatePage bird={mockBird} />);
      expect(screen.queryByText("Cuckooshrikes")).not.toBeInTheDocument();
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
