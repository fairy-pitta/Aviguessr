/**
 * Builds the world species list as SQL, from the caches already on disk.
 *
 * No network: data/_cache_taxonomy.json holds the eBird taxonomy and
 * data/_cache_species_country_map.json holds each species' countries, both
 * collected previously. Run with `npm run build:species-sql`.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import {
  buildSpeciesRows,
  guessableSpecies,
  type TaxonomyEntry,
} from "./lib/species";

const OUT_DIR = "data/world-species";
/*
 * D1 caps a single SQL statement at 100 kB, and `d1 execute --file` posts a
 * whole file in one request, so both the statements and the files are kept
 * well under their limits. 250 species rows is roughly 40 kB.
 */
const SPECIES_PER_STATEMENT = 250;
const RANGE_PER_STATEMENT = 1500;
const BYTES_PER_FILE = 500_000;

function quote(value: string | null): string {
  if (value === null) return "NULL";
  return `'${value.replace(/'/g, "''")}'`;
}

function batches<T>(rows: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

const taxonomy: TaxonomyEntry[] = JSON.parse(
  readFileSync("data/_cache_taxonomy.json", "utf8")
);
const countryMap: Record<string, string[]> = JSON.parse(
  readFileSync("data/_cache_species_country_map.json", "utf8")
);

// Extinct birds are in the eBird taxonomy but no country list places them,
// and a game about where a bird lives cannot ask about them.
const rows = guessableSpecies(buildSpeciesRows(taxonomy, countryMap));
const pairs = rows.flatMap((r) =>
  r.countries.map((code) => ({ speciesCode: r.speciesCode, code }))
);

const statements: string[] = [];

/*
 * Upsert on species_code rather than reload: the rows already in the table
 * keep their ids, and bird_countries and game_rounds still point at them.
 *
 * image_key and playable appear in the insert because image_key is NOT NULL,
 * but they are absent from the update clause on purpose — re-running this
 * must never discard a photograph that has already been collected.
 */
for (const batch of batches(rows, SPECIES_PER_STATEMENT)) {
  const values = batch
    .map(
      (r) =>
        `(${quote(r.speciesCode)},${quote(r.name)},${quote(r.scientificName)},` +
        `${quote(r.genus)},${quote(r.groupWord)},${quote(r.family)},` +
        `${quote(r.familySci)},${quote(r.taxonOrder)},${quote(r.difficulty)},` +
        `${r.rangeSize},'',0)`
    )
    .join(",\n  ");

  statements.push(
    [
      "INSERT INTO birds (species_code, name, scientific_name, genus, group_word,",
      "  family, family_sci, taxon_order, difficulty, range_size,",
      "  image_key, playable) VALUES",
      `  ${values}`,
      "ON CONFLICT(species_code) DO UPDATE SET",
      "  name = excluded.name,",
      "  scientific_name = excluded.scientific_name,",
      "  genus = excluded.genus,",
      "  group_word = excluded.group_word,",
      "  family = excluded.family,",
      "  family_sci = excluded.family_sci,",
      "  taxon_order = excluded.taxon_order,",
      "  difficulty = excluded.difficulty,",
      "  range_size = excluded.range_size;",
    ].join("\n")
  );
}

/*
 * Ranges resolve the species code to an id with one join rather than a
 * subquery per row: 118,132 correlated subqueries is minutes of work, the
 * join is one pass. SQLite names the columns of an inline VALUES table
 * column1, column2.
 */
for (const batch of batches(pairs, RANGE_PER_STATEMENT)) {
  const values = batch
    .map((p) => `(${quote(p.speciesCode)},${quote(p.code)})`)
    .join(",");
  statements.push(
    [
      "INSERT OR IGNORE INTO bird_countries (bird_id, country_code)",
      "SELECT b.id, v.column2",
      `FROM (VALUES ${values}) AS v`,
      "JOIN birds b ON b.species_code = v.column1;",
    ].join("\n")
  );
}

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

let file: string[] = [];
let bytes = 0;
let index = 0;
const flush = () => {
  if (file.length === 0) return;
  index += 1;
  const name = `${OUT_DIR}/${String(index).padStart(3, "0")}.sql`;
  writeFileSync(name, file.join("\n\n") + "\n");
  file = [];
  bytes = 0;
};

for (const statement of statements) {
  if (bytes + statement.length > BYTES_PER_FILE) flush();
  file.push(statement);
  bytes += statement.length;
}
flush();

const longest = Math.max(...statements.map((s) => s.length));
console.log(
  `${OUT_DIR}: ${rows.length} species, ${pairs.length} range rows, ` +
    `${statements.length} statements in ${index} files, ` +
    `longest statement ${(longest / 1024).toFixed(0)} kB`
);
