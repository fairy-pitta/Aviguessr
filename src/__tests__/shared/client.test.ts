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

describe("carrying the old localStorage player over", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    localStorage.clear();
  });

  it("test_fetch_sends_the_cookie_with_every_request", async () => {
    const { apiFetch: freshFetch } = await import("@/shared/api/client");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 })
    );

    await freshFetch("/health");
    expect(fetch).toHaveBeenCalledWith(
      "/api/health",
      expect.objectContaining({ credentials: "same-origin" })
    );
  });

  it("test_fetch_with_a_stored_id_hands_it_over_before_the_request", async () => {
    localStorage.setItem("aviguessr_player_id", "old-id");
    const { apiFetch: freshFetch } = await import("@/shared/api/client");
    const calls: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      calls.push(String(url));
      return new Response("{}", { status: 200 });
    });

    await freshFetch("/game/new");

    expect(calls[0]).toBe("/api/player");
    expect(calls[1]).toBe("/api/game/new");
    // Handed over once and then forgotten
    expect(localStorage.getItem("aviguessr_player_id")).toBeNull();
  });

  it("test_fetch_with_no_stored_id_makes_no_handover_request", async () => {
    const { apiFetch: freshFetch } = await import("@/shared/api/client");
    const calls: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      calls.push(String(url));
      return new Response("{}", { status: 200 });
    });

    await freshFetch("/game/new");
    expect(calls).toEqual(["/api/game/new"]);
  });

  it("test_two_first_requests_hand_the_old_id_over_only_once", async () => {
    // Racing handovers would make the second request find the row the first
    // had just written, and mint a fresh player instead of adopting this one
    localStorage.setItem("aviguessr_player_id", "old-id");
    const { apiFetch: freshFetch } = await import("@/shared/api/client");
    const calls: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      calls.push(String(url));
      return new Response("{}", { status: 200 });
    });

    await Promise.all([freshFetch("/daily/status"), freshFetch("/daily/leaderboard")]);

    expect(calls.filter((u) => u === "/api/player")).toHaveLength(1);
  });

  it("test_a_failed_handover_leaves_the_old_id_for_the_next_load", async () => {
    localStorage.setItem("aviguessr_player_id", "old-id");
    const { apiFetch: freshFetch } = await import("@/shared/api/client");
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) =>
      String(url) === "/api/player"
        ? Promise.reject(new Error("offline"))
        : new Response("{}", { status: 200 })
    );

    await freshFetch("/game/new");
    expect(localStorage.getItem("aviguessr_player_id")).toBe("old-id");
  });
});
