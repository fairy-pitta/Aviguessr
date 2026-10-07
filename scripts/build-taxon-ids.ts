/**
 * Maps every bird in the species list to its iNaturalist taxon id.
 *
 * This exists because `taxon_name` on the observations endpoint is a fuzzy
 * text search, not a filter. Asking it for `Limosa limosa` returns a
 * dowitcher, two other godwits and a salamander, and none of the godwit that
 * was asked for. Anything built on it is guesswork.
 *
 * iNaturalist publishes its whole taxonomy as a Darwin Core archive on a
 * static host, outside the API and its rate limit, so the correct ids come
 * from one download rather than eleven thousand requests. All 11,167 species
 * match by scientific name.
 */
import { createReadStream, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { execFileSync } from "node:child_process";
import { buildSpeciesRows, type TaxonomyEntry } from "./lib/species";

const ARCHIVE = "https://www.inaturalist.org/taxa/inaturalist-taxonomy.dwca.zip";
const CACHE_DIR = "data/_dwca";
const ZIP = `${CACHE_DIR}/taxonomy.zip`;
const CSV = `${CACHE_DIR}/taxa.csv`;
const OUT = "data/_cache_taxon_ids.json";

/** Column order of the archive's taxa.csv, read from its header. */
type Cols = { id: number; class: number; name: number; rank: number };

async function ensureArchive(): Promise<void> {
  if (existsSync(CSV)) return;
  mkdirSync(CACHE_DIR, { recursive: true });

  if (!existsSync(ZIP)) {
    console.log("downloading the iNaturalist taxonomy (~80 MB)");
    const res = await fetch(ARCHIVE);
    if (!res.ok) throw new Error(`http ${res.status}`);
    writeFileSync(ZIP, Buffer.from(await res.arrayBuffer()));
  }
  execFileSync("unzip", ["-o", "-q", ZIP, "taxa.csv", "-d", CACHE_DIR]);
}

function columns(header: string): Cols {
  const f = header.split(",");
  const at = (name: string) => {
    const i = f.indexOf(name);
    if (i < 0) throw new Error(`taxa.csv has no ${name} column`);
    return i;
  };
  return { id: at("id"), class: at("class"), name: at("scientificName"), rank: at("taxonRank") };
}

async function birdIds(): Promise<Map<string, number>> {
  const ids = new Map<string, number>();
  const lines = createInterface({
    input: createReadStream(CSV),
    crlfDelay: Infinity,
  });

  let cols: Cols | null = null;
  for await (const line of lines) {
    if (!cols) {
      cols = columns(line);
      continue;
    }
    const f = line.split(",");
    if (f[cols.class] !== "Aves" || f[cols.rank] !== "species") continue;
    ids.set(f[cols.name], Number(f[cols.id]));
  }
  return ids;
}

await ensureArchive();
const ids = await birdIds();
console.log(`${ids.size} bird species in the iNaturalist taxonomy`);

const taxonomy: TaxonomyEntry[] = JSON.parse(
  await import("node:fs").then((fs) => fs.readFileSync("data/_cache_taxonomy.json", "utf8"))
);
const countryMap: Record<string, string[]> = JSON.parse(
  await import("node:fs").then((fs) =>
    fs.readFileSync("data/_cache_species_country_map.json", "utf8")
  )
);

const species = buildSpeciesRows(taxonomy, countryMap);
const map: Record<string, number> = {};
const missing: string[] = [];

for (const s of species) {
  const id = ids.get(s.scientificName);
  if (id === undefined) missing.push(`${s.speciesCode} ${s.scientificName}`);
  else map[s.speciesCode] = id;
}

writeFileSync(OUT, JSON.stringify(map));
console.log(
  `${Object.keys(map).length}/${species.length} matched, ${missing.length} unmatched -> ${OUT}`
);
if (missing.length) console.log("unmatched:", missing.slice(0, 20).join(", "));
