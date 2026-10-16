import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch } from "@/shared/api/client";

describe("apiFetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("test_fetch_with_valid_response_returns_parsed_json", async () => {
    const mockData = { status: "ok" };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockData), { status: 200 })
    );

    const result = await apiFetch("/health");
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      "/api/health",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("test_fetch_with_error_status_throws_error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Not Found", { status: 404, statusText: "Not Found" })
    );

    await expect(apiFetch("/nonexistent")).rejects.toThrow(
      "API error: 404 Not Found"
    );
  });
});

describe("the player cookie", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("test_fetch_sends_the_cookie_with_every_request", async () => {
    // The player is a signed cookie now. The old scheme sent an id from
    // localStorage in a header, and the daily leaderboard returned every
    // player's id to every client — so those ids were published rather than
    // secret, and honouring one would have handed over the player it names.
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 })
    );

    await apiFetch("/health");
    expect(fetch).toHaveBeenCalledWith(
      "/api/health",
      expect.objectContaining({ credentials: "same-origin" })
    );
  });

  it("test_fetch_sends_no_player_id_header", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 })
    );

    await apiFetch("/game/new");
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(Object.keys(init?.headers ?? {})).not.toContain("X-Player-Id");
  });

  it("test_fetch_makes_exactly_one_request", async () => {
    // Nothing is sent ahead of it: there is no handover to serialise on
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 })
    );

    await apiFetch("/game/new");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
