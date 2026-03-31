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
  };

  it("test_render_with_bird_data_shows_name_and_family", () => {
    render(<BirdCard bird={mockBird} />);
    expect(screen.getByText("Jerdon's Minivet")).toBeInTheDocument();
    expect(screen.getByText("Cuckooshrikes")).toBeInTheDocument();
  });

  it("test_render_with_difficulty_shows_badge", () => {
    render(<BirdCard bird={mockBird} />);
    expect(screen.getByText("hard")).toBeInTheDocument();
  });

  it("test_render_with_null_family_hides_family", () => {
    const birdNoFamily: Bird = { ...mockBird, family: null };
    render(<BirdCard bird={birdNoFamily} />);
    expect(screen.getByText("Jerdon's Minivet")).toBeInTheDocument();
    expect(screen.queryByText("Cuckooshrikes")).not.toBeInTheDocument();
  });

  it("test_render_with_image_sets_alt_text", () => {
    render(<BirdCard bird={mockBird} />);
    const img = screen.getByAltText("Jerdon's Minivet");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/api/birds/1/image");
  });
});
