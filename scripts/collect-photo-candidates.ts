/**
 * Gathers photograph candidates for every bird in the world.
 *
 * This is the first of three passes and the only slow one. It asks
 * iNaturalist for the most-voted research-grade observations of each species,
 * applies the metadata floors, and writes the surviving candidates to a
 * checkpoint. Nothing is downloaded and nothing is chosen here: the vision
 * screen picks from these, and the upload pass fetches only the winner.
 *
 * Species are visited widest range first, so the birds most people can
 * actually go and see are in hand before the endemics. Stopping the run early
 * still leaves a usable set.
 *
 * Resumable: re-running skips every species already in the checkpoint.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { photoCandidates, type Candidate } from "./lib/photo-quality";
import { buildSpeciesRows, type TaxonomyEntry } from "./lib/species";

const API = "https://api.inaturalist.org/v1/observations";
const LICENCES = "cc0,cc-by,cc-by-sa,cc-by-nc,cc-by-nc-sa";
const CHECKPOINT = "data/_cache_photo_candidates.json";
/** iNaturalist asks for under 60 requests a minute sustained. */
const DELAY_MS = 1100;
const PER_PAGE = 40;
const KEEP = 10;
const SAVE_EVERY = 25;

type Entry = {
  taxonId: number | null;
  candidates: Candidate[];
  total: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson(url: string): Promise<any> {
  let wait = 2000;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "AviGuessr/photo-candidates" },
      });
      if (res.status === 429 || res.status >= 500) throw new Error(`http ${res.status}`);
      return await res.json();
    } catch (e) {
      if (attempt === 4) throw e;
      await sleep(wait);
      wait *= 2;
    }
  }
}

const taxonomy: TaxonomyEntry[] = JSON.parse(
  readFileSync("data/_cache_taxonomy.json", "utf8")
);
const countryMap: Record<string, string[]> = JSON.parse(
  readFileSync("data/_cache_species_country_map.json", "utf8")
);

const species = buildSpeciesRows(taxonomy, countryMap).sort(
  (a, b) => b.rangeSize - a.rangeSize
);

const done: Record<string, Entry> = existsSync(CHECKPOINT)
  ? JSON.parse(readFileSync(CHECKPOINT, "utf8"))
  : {};

const save = () => writeFileSync(CHECKPOINT, JSON.stringify(done));

const pending = species.filter((s) => !done[s.speciesCode]);
console.log(
  `${species.length} species, ${Object.keys(done).length} already done, ` +
    `${pending.length} to go (~${((pending.length * DELAY_MS) / 3.6e6).toFixed(1)} h)`
);

let withCandidates = 0;
let processed = 0;

for (const s of pending) {
  const url =
    `${API}?taxon_name=${encodeURIComponent(s.scientificName)}` +
    `&photo_license=${LICENCES}&quality_grade=research&photos=true` +
    `&per_page=${PER_PAGE}&order_by=votes`;

  try {
    const json = await getJson(url);
    const results = json.results ?? [];
    const candidates = photoCandidates(results, s.scientificName).slice(0, KEEP);
    done[s.speciesCode] = {
      taxonId: results[0]?.taxon?.id ?? null,
      candidates,
      total: json.total_results ?? 0,
    };
    if (candidates.length > 0) withCandidates++;
  } catch (e) {
    console.error(`[fail] ${s.speciesCode} ${s.scientificName}: ${String(e).slice(0, 80)}`);
    done[s.speciesCode] = { taxonId: null, candidates: [], total: -1 };
  }

  processed++;
  if (processed % SAVE_EVERY === 0) {
    save();
    const pct = ((processed / pending.length) * 100).toFixed(1);
    console.log(
      `${processed}/${pending.length} (${pct}%) — ${withCandidates} with candidates — last: ${s.name}`
    );
  }
  await sleep(DELAY_MS);
}

save();
console.log(`done: ${processed} queried, ${withCandidates} have at least one candidate`);
