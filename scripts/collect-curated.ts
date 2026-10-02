/**
 * Collects the curated photographs from every bird's taxon page.
 *
 * This replaces the observations crawl. That one asked `taxon_name` for each
 * species in turn, which is a fuzzy text search rather than a filter, so it
 * paid a request per species to receive mostly the wrong birds and threw the
 * wrong ones away. Thirty taxa fetch in one request here, and the ids are
 * exact, so the whole world costs about 373 requests instead of 11,167.
 *
 * The curated photographs are prepended to whatever the observations crawl
 * already found, rather than replacing it. Verdicts are keyed by species and
 * photo url, so a species already given a photograph keeps it, and every
 * species still unjudged now meets the curated set first.
 *
 * Species no country list mentions are skipped: they are the extinct birds,
 * and a game about where a bird lives has nothing to ask about them.
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { curatedCandidates, type InatTaxon } from "./lib/curated-photos";
import type { Candidate } from "./lib/photo-quality";
import {
  buildSpeciesRows,
  guessableSpecies,
  type TaxonomyEntry,
} from "./lib/species";
import { createAdaptiveGate, systemClock } from "./lib/rate-limit";

const API = "https://api.inaturalist.org/v1/taxa";
const CANDIDATES = "data/_cache_photo_candidates.json";
const CURATED = "data/_cache_curated.json";
const TAXON_IDS = "data/_cache_taxon_ids.json";

/** The endpoint takes up to thirty ids at a time. */
const BATCH = 30;
const START_GAP_MS = 3000;
const MIN_GAP_MS = 1500;
const MAX_GAP_MS = 9000;
const COOLDOWN_MS = 60_000;
const EASE_AFTER = 20;
const SAVE_EVERY = 10;

type Entry = { taxonId: number | null; candidates: Candidate[]; total: number };

const gate = createAdaptiveGate({
  startGapMs: START_GAP_MS,
  minGapMs: MIN_GAP_MS,
  maxGapMs: MAX_GAP_MS,
  cooldownMs: COOLDOWN_MS,
  easeAfter: EASE_AFTER,
});

let refusals = 0;

function retryAfterMs(res: Response): number | undefined {
  const raw = res.headers.get("retry-after");
  if (!raw) return undefined;
  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return seconds * 1000;
  const at = Date.parse(raw);
  return Number.isNaN(at) ? undefined : Math.max(0, at - Date.now());
}

async function getTaxa(ids: number[]): Promise<InatTaxon[]> {
  let backoff = 2000;
  for (let attempt = 0; attempt < 6; attempt++) {
    await gate.wait();
    try {
      const res = await fetch(`${API}/${ids.join(",")}`, {
        headers: { "User-Agent": "AviGuessr/curated-photos" },
      });
      if (res.status === 429) {
        refusals++;
        gate.throttled(retryAfterMs(res));
        continue;
      }
      if (res.status >= 500) throw new Error(`http ${res.status}`);
      const json = await res.json();
      gate.succeeded();
      return json.results ?? [];
    } catch (e) {
      if (attempt === 5) throw e;
      await systemClock.sleep(backoff);
      backoff *= 2;
    }
  }
  throw new Error("still refused after six attempts");
}

const read = <T,>(path: string, fallback: T): T =>
  existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback;

const taxonIds: Record<string, number> = read(TAXON_IDS, {});
const curated: Record<string, Candidate[]> = read(CURATED, {});
const candidates: Record<string, Entry> = read(CANDIDATES, {});

function save() {
  writeFileSync(`${CURATED}.tmp`, JSON.stringify(curated));
  renameSync(`${CURATED}.tmp`, CURATED);

  // Curated first, then whatever the observations crawl found, deduped by url.
  const merged: Record<string, Entry> = { ...candidates };
  for (const [code, photos] of Object.entries(curated)) {
    const existing = merged[code]?.candidates ?? [];
    const seen = new Set(photos.map((p) => p.url));
    merged[code] = {
      taxonId: taxonIds[code] ?? null,
      candidates: [...photos, ...existing.filter((c) => !seen.has(c.url))],
      total: merged[code]?.total ?? 0,
    };
  }
  writeFileSync(`${CANDIDATES}.tmp`, JSON.stringify(merged));
  renameSync(`${CANDIDATES}.tmp`, CANDIDATES);
}

const taxonomy: TaxonomyEntry[] = JSON.parse(
  readFileSync("data/_cache_taxonomy.json", "utf8")
);
const countryMap: Record<string, string[]> = JSON.parse(
  readFileSync("data/_cache_species_country_map.json", "utf8")
);

const all = buildSpeciesRows(taxonomy, countryMap);
const playable = guessableSpecies(all).sort((a, b) => b.rangeSize - a.rangeSize);
const pending = playable.filter(
  (s) => curated[s.speciesCode] === undefined && taxonIds[s.speciesCode]
);

console.log(
  `${all.length} species, ${all.length - playable.length} dropped as unplaceable, ` +
    `${playable.length} playable, ${pending.length} still to fetch ` +
    `(${Math.ceil(pending.length / BATCH)} requests)`
);

const startedAt = Date.now();
let done = 0;
let withPhotos = 0;

for (let i = 0; i < pending.length; i += BATCH) {
  const batch = pending.slice(i, i + BATCH);
  const ids = batch.map((s) => taxonIds[s.speciesCode]);

  let taxa: InatTaxon[];
  try {
    taxa = await getTaxa(ids);
  } catch (e) {
    console.error(`[fail] batch at ${i}: ${String(e).slice(0, 80)}`);
    continue;
  }

  const byId = new Map(taxa.map((t) => [t.id, t]));
  for (const s of batch) {
    const taxon = byId.get(taxonIds[s.speciesCode]);
    // An id the endpoint did not return is left out, so a re-run retries it.
    if (!taxon) continue;
    const photos = curatedCandidates(taxon);
    curated[s.speciesCode] = photos;
    if (photos.length > 0) withPhotos++;
    done++;
  }

  const requests = i / BATCH + 1;
  if (requests % SAVE_EVERY === 0 || i + BATCH >= pending.length) {
    save();
    const mins = (Date.now() - startedAt) / 60000;
    const left = (pending.length - done) / (done / mins) / 60;
    console.log(
      `${done}/${pending.length} (${((done / pending.length) * 100).toFixed(1)}%) — ` +
        `${withPhotos} with photographs — gap ${(gate.gapMs() / 1000).toFixed(1)}s — ` +
        `${refusals} refusals — ${left.toFixed(1)} h left`
    );
  }
}

save();
console.log(
  `done: ${done} species, ${withPhotos} have at least one curated photograph, ${refusals} refusals`
);
