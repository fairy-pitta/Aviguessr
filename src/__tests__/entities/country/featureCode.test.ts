import { describe, it, expect } from "vitest";
import { featureCountryCode } from "@/entities/country";

describe("featureCountryCode", () => {
  it("test_feature_country_code_with_plain_iso_code_returns_it_unchanged", () => {
    expect(featureCountryCode({ iso_a2: "JP" })).toBe("JP");
  });

  it("test_feature_country_code_with_taiwan_spelling_returns_iso_code", () => {
    expect(featureCountryCode({ iso_a2: "CN-TW" })).toBe("TW");
  });

  it("test_feature_country_code_with_missing_iso_recovers_from_adm0_a3", () => {
    expect(featureCountryCode({ iso_a2: "-99", adm0_a3: "FRA" })).toBe("FR");
    expect(featureCountryCode({ iso_a2: "-99", adm0_a3: "NOR" })).toBe("NO");
  });

  it("test_feature_country_code_with_unrecoverable_feature_returns_null", () => {
    expect(featureCountryCode({ iso_a2: "-99", adm0_a3: "SOL" })).toBeNull();
  });

  it("test_feature_country_code_with_no_properties_returns_null", () => {
    expect(featureCountryCode(null)).toBeNull();
    expect(featureCountryCode({})).toBeNull();
  });

  it("test_feature_country_code_result_is_present_in_country_names", async () => {
    const { COUNTRY_NAMES } = await import("@/entities/country");
    expect(COUNTRY_NAMES[featureCountryCode({ iso_a2: "CN-TW" })!]).toBe(
      "Taiwan"
    );
  });
});
