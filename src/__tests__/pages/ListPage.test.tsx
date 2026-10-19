import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ListPage } from "@/pages/list";

const listBody = {
  summary: { species: 2, named: 1, bogeys: 1 },
  entries: [
    {
      birdId: 1,
      name: "Marsh Wren",
      family: "Wrens",
      encounters: 2,
      correct: 1,
      bestScore: 4800,
      lastGuess: "US",
      firstSeenAt: "2026-10-01 10:00:00",
      lastSeenAt: "2026-10-02 10:00:00",
      imageUrl: "/api/birds/1/image",
    },
    {
      birdId: 2,
      name: "Gray Antwren",
      family: "Antbirds",
      encounters: 3,
      correct: 0,
      bestScore: 180,
      lastGuess: "BR",
      firstSeenAt: "2026-10-01 10:00:00",
      lastSeenAt: "2026-10-03 10:00:00",
      imageUrl: "/api/birds/2/image",
    },
  ],
};

const playerBody = {
  streakDays: 4,
  lastDailyDate: "2026-10-16",
  hasRecoveryCode: false,
  lifeList: listBody.summary,
};

function serve(responses: Record<string, unknown>, status = 200) {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
    const path = String(url);
    const body = Object.entries(responses).find(([p]) => path.endsWith(p))?.[1];
    return new Response(JSON.stringify(body ?? {}), { status });
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ListPage />
    </MemoryRouter>
  );
}

describe("ListPage", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("test_render_before_the_list_arrives_says_it_is_opening", async () => {
    serve({ "/life-list": listBody, "/player": playerBody });
    renderPage();
    expect(screen.getByText("Opening your list")).toBeInTheDocument();
    // Let the load settle so the state update lands inside the test
    await waitFor(() =>
      expect(screen.queryByText("Opening your list")).not.toBeInTheDocument()
    );
  });

  it("test_render_shows_how_many_species_were_met_and_placed", async () => {
    serve({ "/life-list": listBody, "/player": playerBody });
    renderPage();

    await waitFor(() =>
      expect(screen.getByText("species met")).toBeInTheDocument()
    );
    expect(screen.getByText("placed")).toBeInTheDocument();
  });

  it("test_render_shows_the_daily_streak_when_there_is_one", async () => {
    serve({ "/life-list": listBody, "/player": playerBody });
    renderPage();

    await waitFor(() =>
      expect(screen.getByText("4 days running")).toBeInTheDocument()
    );
  });

  it("test_render_lists_the_birds_under_their_families", async () => {
    serve({ "/life-list": listBody, "/player": playerBody });
    renderPage();

    await waitFor(() =>
      expect(screen.getByText("Marsh Wren")).toBeInTheDocument()
    );
    expect(screen.getByRole("heading", { name: "Antbirds" })).toBeInTheDocument();
    expect(screen.getByText("Missed 3 times")).toBeInTheDocument();
  });

  it("test_render_offers_a_code_to_a_player_who_has_none", async () => {
    serve({ "/life-list": listBody, "/player": playerBody });
    renderPage();

    await waitFor(() =>
      expect(screen.getByText("Make a code")).toBeInTheDocument()
    );
  });

  it("test_render_warns_that_a_new_code_replaces_the_old_one", async () => {
    serve({
      "/life-list": listBody,
      "/player": { ...playerBody, hasRecoveryCode: true },
    });
    renderPage();

    await waitFor(() =>
      expect(screen.getByText(/Making a new one replaces it/)).toBeInTheDocument()
    );
  });

  it("test_render_with_an_unreachable_server_offers_a_way_back", async () => {
    serve({ "/life-list": {}, "/player": {} }, 500);
    renderPage();

    await waitFor(() =>
      expect(screen.getByText("Could not open the list.")).toBeInTheDocument()
    );
    expect(screen.getByText("Back to the guide")).toBeInTheDocument();
  });
});
