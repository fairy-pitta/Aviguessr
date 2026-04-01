/**
 * Populate habitat/biome/range_description for birds in D1
 * Derives data from bird countries + region mapping
 *
 * Usage: npx tsx scripts/populate-bird-metadata.ts
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type BirdEntry = {
  speciesCode: string;
  name: string;
  countries: string[];
  family: string;
};

type GeoFeature = {
  properties: {
    iso_a2: string;
    continent: string;
    subregion: string;
    [key: string]: unknown;
  };
};

// Load GeoJSON for region data
const geoJson = JSON.parse(
  readFileSync(
    resolve(__dirname, "../public/data/world-countries.geo.json"),
    "utf-8"
  )
);

const regionMap: Record<string, { continent: string; subregion: string }> = {};
for (const f of geoJson.features as GeoFeature[]) {
  const code = f.properties.iso_a2;
  if (!code || code === "-99") continue;
  regionMap[code] = {
    continent: f.properties.continent,
    subregion: f.properties.subregion,
  };
}

// Load country names
const countryNames: Record<string, string> = {};
for (const f of geoJson.features as GeoFeature[]) {
  const code = f.properties.iso_a2;
  if (!code || code === "-99") continue;
  countryNames[code] = (f.properties.name_en as string) || (f.properties.name as string);
}

// Biome inference from family + continent
const familyBiomeMap: Record<string, string> = {
  Penguins: "coastal",
  "Petrels, Shearwaters": "coastal",
  "Herons, Egrets, Bitterns": "wetland",
  "Ducks, Geese, Swans": "wetland",
  "Rails, Gallinules, Coots": "wetland",
  Flamingos: "wetland",
  "Sandpipers, Snipes": "wetland",
  Kingfishers: "wetland",
  "Hawks, Eagles, Kites": "grassland",
  Parrots: "tropical_forest",
  Toucans: "tropical_forest",
  "Hummingbirds": "tropical_forest",
  Owls: "temperate_forest",
  Woodpeckers: "temperate_forest",
  Larks: "grassland",
  Swallows: "grassland",
  "Crows, Jays, Magpies": "temperate_forest",
};

function inferBiome(family: string, continents: string[]): string {
  // Check family-based mapping first
  for (const [key, biome] of Object.entries(familyBiomeMap)) {
    if (family.toLowerCase().includes(key.toLowerCase())) return biome;
  }

  // Infer from dominant continent
  const primary = continents[0] || "";
  if (continents.some((c) => c === "Antarctica")) return "tundra";
  if (
    primary === "Africa" &&
    continents.length === 1
  )
    return "tropical_forest";
  if (primary === "South America") return "tropical_forest";
  if (primary === "Asia") return "tropical_forest";
  if (primary === "Europe") return "temperate_forest";
  if (primary === "Oceania") return "tropical_forest";
  if (primary === "North America") return "temperate_forest";

  return "tropical_forest";
}

function generateRangeDescription(
  countries: string[],
  continents: string[],
  subregions: string[]
): string {
  const uniqueContinents = [...new Set(continents)];
  const uniqueSubregions = [...new Set(subregions)];

  if (countries.length === 1) {
    return `Endemic to ${countryNames[countries[0]] || countries[0]}`;
  }
  if (countries.length <= 3) {
    return `Found in ${countries.map((c) => countryNames[c] || c).join(", ")}`;
  }
  if (uniqueContinents.length === 1 && uniqueSubregions.length === 1) {
    return `Found across ${uniqueSubregions[0]} (${countries.length} countries)`;
  }
  if (uniqueContinents.length === 1) {
    return `Distributed across ${uniqueContinents[0]} (${countries.length} countries)`;
  }
  return `Wide range across ${uniqueContinents.join(" and ")} (${countries.length} countries)`;
}

const biomeLabels: Record<string, string> = {
  tropical_forest: "Tropical & Subtropical Forest",
  temperate_forest: "Temperate Forest",
  grassland: "Grassland & Savanna",
  wetland: "Wetland & Freshwater",
  coastal: "Coastal & Marine",
  desert: "Arid & Semi-arid",
  alpine: "Montane & Alpine",
  tundra: "Tundra & Polar",
  urban: "Urban & Agricultural",
};

// Process birds
const birds: BirdEntry[] = JSON.parse(
  readFileSync(resolve(__dirname, "../data/birds.json"), "utf-8")
);

function escapeSql(s: string): string {
  return s.replace(/'/g, "''");
}

const sqls: string[] = [];

for (const bird of birds) {
  const continents = bird.countries
    .map((c) => regionMap[c]?.continent)
    .filter(Boolean);
  const subregions = bird.countries
    .map((c) => regionMap[c]?.subregion)
    .filter(Boolean);

  const biome = inferBiome(bird.family, continents);
  const habitat = biomeLabels[biome] || biome;
  const rangeDesc = generateRangeDescription(
    bird.countries,
    continents,
    subregions
  );

  sqls.push(
    `UPDATE birds SET biome='${escapeSql(biome)}', habitat='${escapeSql(habitat)}', range_description='${escapeSql(rangeDesc)}' WHERE species_code='${escapeSql(bird.speciesCode)}';`
  );
}

// Write SQL file and execute
const sqlPath = resolve(__dirname, "../data/update-metadata.sql");
const { writeFileSync } = await import("node:fs");
writeFileSync(sqlPath, sqls.join("\n"));

console.log(`Generated ${sqls.length} UPDATE statements`);
console.log("Executing on remote D1...");

try {
  execSync(
    `npx wrangler d1 execute aviguessr-db --remote --file=${sqlPath}`,
    { stdio: "inherit", timeout: 60000 }
  );
  console.log("Done!");
} catch (e) {
  console.error("Failed to execute. Run manually:");
  console.error(`  npx wrangler d1 execute aviguessr-db --remote --file=${sqlPath}`);
}
