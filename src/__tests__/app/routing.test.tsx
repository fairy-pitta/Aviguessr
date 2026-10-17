import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "@/pages/home";
import { ListPage } from "@/pages/list";
import { NotFoundPage } from "@/pages/not-found";

/**
 * The routes as App declares them. Duplicated rather than imported because
 * App brings its own BrowserRouter, and these need to start at a given path.
 */
function routesAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/list" element={<ListPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("an address the guide does not have", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 })
    );
  });

  it("test_an_unknown_path_renders_a_page_rather_than_nothing", () => {
    // It used to render nothing at all: the router matched no route and there
    // was no fallback, so a mistyped address was a white screen
    const { container } = routesAt("/no-such-page");
    expect(container.textContent).not.toBe("");
    expect(
      screen.getByText("There is no such page in this guide")
    ).toBeInTheDocument();
  });

  it("test_an_unknown_path_offers_a_way_back", () => {
    routesAt("/no-such-page");
    expect(screen.getByText("Back to the guide")).toBeInTheDocument();
  });

  it("test_a_deep_unknown_path_is_also_caught", () => {
    routesAt("/game");
    expect(
      screen.getByText("There is no such page in this guide")
    ).toBeInTheDocument();
  });

  it("test_the_list_path_still_reaches_the_list_and_not_the_fallback", async () => {
    routesAt("/list");
    expect(
      screen.queryByText("There is no such page in this guide")
    ).not.toBeInTheDocument();
    // Let the list's own load settle so its state update lands in the test
    await waitFor(() =>
      expect(screen.queryByText("Opening your list")).not.toBeInTheDocument()
    );
  });
});
