import { describe, it, expect } from "vitest";
import { parseGuessBody } from "../services/game";

describe("parseGuessBody", () => {
  it("test_parse_guess_body_with_a_round_and_country_code_returns_them", () => {
    expect(parseGuessBody({ round: 1, countryCode: "JP" })).toEqual({
      round: 1,
      countryCode: "JP",
    });
  });

  it("test_parse_guess_body_ignores_fields_the_server_derives", () => {
    // timeMs and hintsUsed are the server's to decide, never the client's
    expect(
      parseGuessBody({ round: 2, countryCode: "BR", timeMs: 0, hintsUsed: 0 })
    ).toEqual({ round: 2, countryCode: "BR" });
  });

  it("test_parse_guess_body_without_a_country_code_returns_null", () => {
    expect(parseGuessBody({ round: 1 })).toBeNull();
  });

  it("test_parse_guess_body_with_a_blank_country_code_returns_null", () => {
    expect(parseGuessBody({ round: 1, countryCode: "  " })).toBeNull();
  });

  it("test_parse_guess_body_without_a_round_returns_null", () => {
    expect(parseGuessBody({ countryCode: "JP" })).toBeNull();
  });

  it("test_parse_guess_body_with_a_fractional_round_returns_null", () => {
    expect(parseGuessBody({ round: 1.5, countryCode: "JP" })).toBeNull();
  });

  it("test_parse_guess_body_with_a_round_below_one_returns_null", () => {
    expect(parseGuessBody({ round: 0, countryCode: "JP" })).toBeNull();
  });

  it("test_parse_guess_body_of_a_non_object_returns_null", () => {
    // A request body that was not JSON at all arrives here as null
    expect(parseGuessBody(null)).toBeNull();
    expect(parseGuessBody("JP")).toBeNull();
  });
});
