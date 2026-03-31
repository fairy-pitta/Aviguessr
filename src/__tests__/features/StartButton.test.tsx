import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StartButton } from "@/features/start-game";

describe("StartButton", () => {
  it("test_render_idle_shows_play_text", () => {
    render(<StartButton loading={false} onStart={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveTextContent("Play");
  });

  it("test_render_loading_shows_loading_text", () => {
    render(<StartButton loading={true} onStart={vi.fn()} />);
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("Loading...");
    expect(button).toBeDisabled();
  });

  it("test_click_calls_on_start", () => {
    const onStart = vi.fn();
    render(<StartButton loading={false} onStart={onStart} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onStart).toHaveBeenCalledOnce();
  });
});
