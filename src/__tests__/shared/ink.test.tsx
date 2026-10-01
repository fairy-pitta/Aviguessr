import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InkBox, HandRule } from "@/shared/ui";

describe("InkBox", () => {
  it("test_render_with_children_keeps_the_content_in_the_document", () => {
    render(
      <InkBox>
        <span>Which continents</span>
      </InkBox>
    );
    expect(screen.getByText("Which continents")).toBeInTheDocument();
  });

  it("test_render_hides_the_drawn_frame_from_assistive_technology", () => {
    const { container } = render(
      <InkBox>
        <span>body</span>
      </InkBox>
    );
    const frame = container.querySelector("svg");
    expect(frame).toHaveAttribute("aria-hidden", "true");
  });
});

describe("HandRule", () => {
  it("test_render_hides_the_drawn_line_from_assistive_technology", () => {
    const { container } = render(<HandRule />);
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });
});
