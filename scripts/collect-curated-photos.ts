/**
 * Adds iNaturalist's curated photographs to the candidate list.
 *
 * A taxon page carries `taxon_photos`, which curators have chosen as
 * representative of the species — exactly the judgement we are otherwise
 * paying a vision pass to make. They go to the front of each species' list so
 * the screen sees them first.
 *
 * Cheap: the taxa endpoint accepts up to 30 ids at a time, so the whole world
 * takes a few hundred requests rather than one per species. Run after
 * collect:photo-candidates, which is where the taxon ids come from.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import {
  LICENCE_LABELS,
  MAX_ASPECT,
  MIN_LONG_SIDE,
  type Candidate,
} from "./lib/photo-quality";
import { photographer } from "./lib/image-sources";

const CHECKPOINT = "data/_cache_photo_candidates.json";
const BATCH = 30;
const DELAY_MS = 1100;
const COMMERCIAL = new Set(["CC0", "CC BY", "CC BY-SA"]);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Entry = { taxonId: number | null; candidates: Candidate[]; total: number; curated?: boolean };

if (!existsSync(CHECKPOINT)) {
  console.error(`${CHECKPOINT} not found — run collect:photo-candidates first`);
  process.exit(1);
}
const entries: Record<string, Entry> = JSON.parse(readFileSync(CHECKPOINT, "utf8"));

const byTaxon = new Map<number, string>();
for (const [code, e] of Object.entries(entries)) {
  if (e.taxonId && !e.curated) byTaxon.set(e.taxonId, code);
}
const ids = [...byTaxon.keys()];
console.log(`${ids.length} taxa to enrich in ${Math.ceil(ids.length / BATCH)} requests`);

let added = 0;
for (let i = 0; i < ids.length; i += BATCH) {
  const slice = ids.slice(i, i + BATCH);
  try {
    const res = await fetch(`https://api.inaturalist.org/v1/taxa/${slice.join(",")}`, {
      headers: { "User-Agent": "AviGuessr/curated-photos" },
    });
    const json = await res.json();

    for (const taxon of json.results ?? []) {
      const code = byTaxon.get(taxon.id);
      if (!code) continue;
      const entry = entries[code];
      const have = new Set(entry.candidates.map((c) => c.url));
      const curated: Candidate[] = [];

      for (const tp of taxon.taxon_photos ?? []) {
        const photo = tp.photo ?? {};
        const license = photo.license_code ? LICENCE_LABELS[photo.license_code] : undefined;
        if (!license) continue;
        const d = photo.original_dimensions;
        if (!d?.width || !d?.height) continue;
        const long = Math.max(d.width, d.height);
        const short = Math.min(d.width, d.height);
        if (long < MIN_LONG_SIDE || long / short > MAX_ASPECT) continue;

        const url = String(photo.url ?? "").replace(/\/square\./, "/large.");
        if (!url || have.has(url)) continue;
        have.add(url);
        curated.push({
          photoId: photo.id,
          url,
          license,
          commercial: COMMERCIAL.has(license),
          artist: photographer(photo.attribution ?? "", { name: undefined, login: undefined }),
          faves: 0,
          width: d.width,
          height: d.height,
        });
      }

      // Curators chose these, so they are screened before the vote ranking
      entry.candidates = [...curated, ...entry.candidates];
      entry.curated = true;
      added += curated.length;
    }
  } catch (e) {
    console.error(`[fail] batch at ${i}: ${String(e).slice(0, 80)}`);
  }

  if ((i / BATCH) % 20 === 0) {
    writeFileSync(CHECKPOINT, JSON.stringify(entries));
    console.log(`${i + slice.length}/${ids.length} — ${added} curated photos added`);
  }
  await sleep(DELAY_MS);
}

writeFileSync(CHECKPOINT, JSON.stringify(entries));
console.log(`done: ${added} curated photographs added to the front of the candidate lists`);
