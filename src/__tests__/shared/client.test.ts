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
