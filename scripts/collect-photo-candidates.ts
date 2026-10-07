/**
 * Gathers photograph candidates for every bird in the world.
 *
 * This is the first of three passes and the only slow one. It asks
 * iNaturalist for the most-voted research-grade observations of each species,
 * applies the metadata floors, and writes the surviving candidates to a
 * checkpoint. Nothing is downloaded and nothing is chosen here: the vision
 * screen picks from these, and the upload pass fetches only the winner.
 *
 * One species is one request, paced by a shared gate rather than by a sleep
 * after each round trip, so the host sees a steady rate the whole way through
 * instead of the much slower one that serialising latency behind a delay
 * produces. A few requests are in flight at once purely to hide that latency.
 *
 * The rate is not fixed. iNaturalist publishes 60 requests a minute but
 * enforces something tighter: a steady 48/min ran clean for an hour and was
 * then refused with `429 normal_throttling` for everything that followed. The
 * gate widens on refusal and eases back down, so the run settles at whatever
 * the host is actually willing to serve today.
 *
 * Species are visited widest range first, so the birds most people can
 * actually go and see are in hand before the endemics. Stopping the run early
 * still leaves a usable set.
 *
 * Resumable: re-running skips every species already in the checkpoint.
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { photoCandidates, type Candidate } from "./lib/photo-quality";
import {
  buildSpeciesRows,
  pendingSpecies,
  type TaxonomyEntry,
} from "./lib/species";
import { createAdaptiveGate, systemClock } from "./lib/rate-limit";

const API = "https://api.inaturalist.org/v1/observations";
const LICENCES = "cc0,cc-by,cc-by-sa,cc-by-nc,cc-by-nc-sa";
const CHECKPOINT = "data/_cache_photo_candidates.json";
/**
 * Opening pace, and the band the gate is allowed to move within: between 40
 * and 7 requests a minute. It starts at 20/min — below the 48/min that was
 * eventually refused — and climbs only if the host keeps answering.
 */
const START_GAP_MS = 3000;
const MIN_GAP_MS = 1500;
const MAX_GAP_MS = 9000;
/** How long every worker stands down after a refusal. */
const COOLDOWN_MS = 60_000;
/** Successes before the gate is allowed to speed up again. */
const EASE_AFTER = 40;
/** Enough to keep a slot always ready behind a ~2.5 s round trip. */
const CONCURRENCY = 3;
const PER_PAGE = 40;
const KEEP = 10;
const SAVE_EVERY = 50;

type Entry = {
  taxonId: number | null;
  candidates: Candidate[];
  total: number;
};

const gate = createAdaptiveGate({
  startGapMs: START_GAP_MS,
  minGapMs: MIN_GAP_MS,
  maxGapMs: MAX_GAP_MS,
  cooldownMs: COOLDOWN_MS,
  easeAfter: EASE_AFTER,
});

let throttleEvents = 0;

/** Seconds, or an HTTP date; absent on iNaturalist but honoured if it appears. */
function retryAfterMs(res: Response): number | undefined {
  const raw = res.headers.get("retry-after");
  if (!raw) return undefined;
  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return seconds * 1000;
  const at = Date.parse(raw);
  return Number.isNaN(at) ? undefined : Math.max(0, at - Date.now());
}

async function getJson(url: string): Promise<any> {
  let backoff = 2000;
  for (let attempt = 0; attempt < 6; attempt++) {
    await gate.wait();
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "AviGuessr/photo-candidates" },
      });

      // A refusal is the host's business, not this request's: the gate holds
      // every worker back rather than this one retrying into the same wall.
      if (res.status === 429) {
        throttleEvents++;
        gate.throttled(retryAfterMs(res));
        continue;
      }
      if (res.status >= 500) throw new Error(`http ${res.status}`);

      const json = await res.json();
      gate.succeeded();
      return json;
    } catch (e) {
      if (attempt === 5) throw e;
      await systemClock.sleep(backoff);
      backoff *= 2;
    }
  }
  throw new Error("still refused after six attempts");
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

/**
 * Written aside and renamed, because a run that is killed partway through a
 * 4 MB write would otherwise leave a truncated checkpoint and lose hours.
 */
function save() {
  writeFileSync(`${CHECKPOINT}.tmp`, JSON.stringify(done));
  renameSync(`${CHECKPOINT}.tmp`, CHECKPOINT);
}

const pending = pendingSpecies(species, done);
const retrying = pending.filter((s) => done[s.speciesCode] !== undefined).length;
console.log(
  `${species.length} species, ${Object.keys(done).length - retrying} collected, ` +
    `${pending.length} to go (${retrying} of them retries of failed requests), ` +
    `starting at ${(60000 / START_GAP_MS).toFixed(0)}/min`
);

const startedAt = Date.now();
let next = 0;
let processed = 0;
let withCandidates = 0;

async function worker() {
  while (next < pending.length) {
    const s = pending[next++];
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
      console.error(
        `[fail] ${s.speciesCode} ${s.scientificName}: ${String(e).slice(0, 80)}`
      );
      done[s.speciesCode] = { taxonId: null, candidates: [], total: -1 };
    }

    processed++;
    if (processed % SAVE_EVERY === 0) {
      save();
      const mins = (Date.now() - startedAt) / 60000;
      const rate = processed / mins;
      const left = (pending.length - processed) / rate / 60;
      console.log(
        `${processed}/${pending.length} (${((processed / pending.length) * 100).toFixed(1)}%) — ` +
          `${withCandidates} with candidates — ${rate.toFixed(1)}/min — ` +
          `gap ${(gate.gapMs() / 1000).toFixed(1)}s — ${throttleEvents} refusals — ` +
          `${left.toFixed(1)} h left — last: ${s.name}`
      );
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

save();
const stillFailed = pending.filter((s) => done[s.speciesCode]?.total === -1).length;
console.log(
  `done: ${processed} queried, ${withCandidates} have at least one candidate, ` +
    `${stillFailed} still failing (re-run to retry them), ` +
    `${throttleEvents} refusals`
);
