import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FieldKit } from "@/shared/ui";

describe("FieldKit", () => {
  it("test_render_exposes_the_drawing_as_a_described_image", () => {
    render(<FieldKit />);
    const drawing = screen.getByRole("img");
    expect(drawing).toHaveAccessibleName(
      /open field notebook.*binoculars/i
    );
  });

  it("test_render_with_a_class_keeps_the_caller_sizing_in_place", () => {
    render(<FieldKit className="h-40" />);
    expect(screen.getByRole("img")).toHaveClass("h-40");
  });
});
