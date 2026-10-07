/**
 * Populate birds.fun_fact in D1 from Wikipedia page summaries.
 *
 * Looks each bird up by scientific name (falling back to the common name),
 * keeps the first sentence of the extract, and writes the results to D1.
 * Progress is checkpointed, so the script can be re-run after an interruption
 * and will only fetch the birds it has not resolved yet.
 *
 * The birds are the photographed ones from the world list, not the original
 * 939-species sample: a fact is shown on the round-end page, so a species the
 * game cannot put on screen has no use for one, and fetching all 10,982 would
 * be four hours of requests for facts nobody reads.
 *
 * Usage: npx tsx scripts/populate-fun-facts.ts [--dry-run] [--limit=N]
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { pickFunFact, titleCandidates } from "./lib/fun-facts";
import {
  buildSpeciesRows,
  guessableSpecies,
  photographedSpecies,
  type TaxonomyEntry,
} from "./lib/species";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CHECKPOINT_PATH = resolve(__dirname, "../data/_cache_fun_facts.json");
const SQL_PATH = resolve(__dirname, "../data/update-fun-facts.sql");
const SUMMARY_API = "https://en.wikipedia.org/api/rest_v1/page/summary";
const REQUEST_DELAY_MS = 120; // ~8 req/s, well inside Wikimedia's limits
const MAX_RETRIES = 3;
const USER_AGENT =
  "AviGuessr/1.0 (https://github.com/fairy-pitta/Aviguessr; bird quiz game)";

type BirdEntry = {
  speciesCode: string;
  name: string;
  scientificName: string;
};

/** speciesCode -> fun fact, or null when Wikipedia had nothing usable. */
type Checkpoint = Record<string, string | null>;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function loadCheckpoint(): Checkpoint {
  if (!existsSync(CHECKPOINT_PATH)) return {};
  return JSON.parse(readFileSync(CHECKPOINT_PATH, "utf-8")) as Checkpoint;
}

function saveCheckpoint(checkpoint: Checkpoint): void {
  writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint, null, 2));
}

function escapeSql(s: string): string {
  return s.replace(/'/g, "''");
}

/** Wikipedia extract for `title`, or null if the page is missing. */
async function fetchExtract(title: string): Promise<string | null> {
  const url = `${SUMMARY_API}/${encodeURIComponent(title.replace(/ /g, "_"))}`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      });

      if (res.status === 404) return null;

      if (res.status === 429 || res.status >= 500) {
        await sleep(1000 * attempt);
        continue;
      }

      if (!res.ok) return null;

      const json = (await res.json()) as {
        extract?: string;
        type?: string;
      };

      // Disambiguation pages are never useful as a fact.
      if (json.type === "disambiguation") return null;

      return json.extract ?? null;
    } catch {
      if (attempt === MAX_RETRIES) return null;
      await sleep(1000 * attempt);
    }
  }

  return null;
}

async function resolveFunFact(bird: BirdEntry): Promise<string | null> {
  for (const title of titleCandidates(bird.scientificName, bird.name)) {
    const extract = await fetchExtract(title);
    await sleep(REQUEST_DELAY_MS);

    if (!extract) continue;

    const fact = pickFunFact(extract);
    if (fact) return fact;
  }

  return null;
}

function readCache<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(__dirname, `../data/${name}`), "utf-8"));
}

const birds: BirdEntry[] = photographedSpecies(
  guessableSpecies(
    buildSpeciesRows(
      readCache<TaxonomyEntry[]>("_cache_taxonomy.json"),
      readCache<Record<string, string[]>>("_cache_species_country_map.json")
    )
  ),
  readCache<Record<string, unknown>>("_cache_uploaded_photos.json")
);

/** Only these species are written back; the rest of the checkpoint is history. */
const target = new Set(birds.map((b) => b.speciesCode));

const checkpoint = loadCheckpoint();
const pending = birds
  .filter((b) => !(b.speciesCode in checkpoint))
  .slice(0, limit === Infinity ? undefined : limit);

console.log(
  `${birds.length} photographed birds, ${Object.keys(checkpoint).length} already resolved, ${pending.length} to fetch`
);

let fetched = 0;
for (const bird of pending) {
  checkpoint[bird.speciesCode] = await resolveFunFact(bird);
  fetched++;

  if (fetched % 25 === 0) {
    saveCheckpoint(checkpoint);
    console.log(`  ${fetched}/${pending.length} fetched`);
  }
}
saveCheckpoint(checkpoint);

const facts = Object.entries(checkpoint).filter(
  (entry): entry is [string, string] => entry[1] !== null && target.has(entry[0])
);

console.log(
  `Resolved ${facts.length}/${target.size} birds (${target.size - facts.length} without a usable summary)`
);

const sqls = facts.map(
  ([speciesCode, fact]) =>
    `UPDATE birds SET fun_fact='${escapeSql(fact)}' WHERE species_code='${escapeSql(speciesCode)}';`
);
writeFileSync(SQL_PATH, sqls.join("\n"));
console.log(`Wrote ${sqls.length} UPDATE statements to ${SQL_PATH}`);

if (dryRun) {
  console.log("--dry-run: skipping D1 execution");
  process.exit(0);
}

console.log("Executing on remote D1...");
try {
  execSync(`npx wrangler d1 execute aviguessr-db --remote --file=${SQL_PATH}`, {
    stdio: "inherit",
    timeout: 300000,
  });
  console.log("Done!");
} catch {
  console.error("Failed to execute. Run manually:");
  console.error(
    `  npx wrangler d1 execute aviguessr-db --remote --file=${SQL_PATH}`
  );
  process.exit(1);
}
