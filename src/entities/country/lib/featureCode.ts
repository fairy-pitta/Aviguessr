import { CODE_OVERRIDES } from "./countries";

type FeatureProperties = {
  iso_a2?: unknown;
  adm0_a3?: unknown;
} | null | undefined;

/**
 * ISO 3166-1 alpha-2 code for a world-map feature, or null when the feature
 * has no ISO identity (Somaliland, Northern Cyprus).
 *
 * The map data spells Taiwan "CN-TW" and leaves iso_a2 as "-99" for a few
 * disputed cases, so a raw read would submit codes that can never match a
 * bird's countries. Mirrors resolveCode() in scripts/generate-centroids.ts.
 */
export function featureCountryCode(properties: FeatureProperties): string | null {
  const raw = typeof properties?.iso_a2 === "string" ? properties.iso_a2 : "";
  if (raw && CODE_OVERRIDES[raw]) return CODE_OVERRIDES[raw];
  if (raw && raw !== "-99") return raw;

  const adm = typeof properties?.adm0_a3 === "string" ? properties.adm0_a3 : "";
  return adm && CODE_OVERRIDES[adm] ? CODE_OVERRIDES[adm] : null;
}
