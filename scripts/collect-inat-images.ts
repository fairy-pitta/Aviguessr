/**
 * Replace the bird images in data/birds.json with iNaturalist photographs.
 *
 * A visual audit of the previous Commons-sourced set found only 35% of the 939
 * images showed a living bird — the rest were distribution maps, hand-coloured
 * plates, museum study skins, book scans, and one audio-file icon shared by 98
 * species. Filtering Commons by file name recovers 96% of the good photos but
 * still lets 37% rubbish through, almost all of it 19th-century plates whose
 * file names look like ordinary photographs, so Commons cannot be repaired
 * from metadata alone.
 *
 * iNaturalist research-grade observations are photographs of living organisms
 * whose identification other observers have confirmed, which rules out plates
 * and specimens by construction. Species with no permissively licensed photo
 * are marked `playable: false` rather than given a wrong picture.
 *
 * Usage: npx tsx scripts/collect-inat-images.ts [--dry-run] [--limit=N]
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pickInatPhoto, type InatObservation } from "./lib/image-sources";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BIRDS_PATH = resolve(__dirname, "../data/birds.json");
const CHECKPOINT_PATH = resolve(__dirname, "../data/_cache_inat_images.json");
const API = "https://api.inaturalist.org/v1/observations";
const PERMISSIVE = "cc0,cc-by,cc-by-sa"; // no NC variants
const PER_PAGE = 10; // alternatives to fall back on when a photo is taken
const REQUEST_DELAY_MS = 700; // ~85 req/min, inside iNaturalist's guidance
const MAX_RETRIES = 3;
const USER_AGENT =
  "AviGuessr/1.0 (https://github.com/fairy-pitta/Aviguessr; bird quiz game)";

type BirdImage = { url: string; license: string; artist: string };
type Bird = {
  speciesCode: string;
  name: string;
  scientificName: string;
  family: string;
  countries: string[];
  difficulty: string;
  image: BirdImage | null;
  imageSource?: string;
  playable?: boolean;
};

/** speciesCode -> the observations payload we chose from, or null when empty. */
type Checkpoint = Record<string, BirdImage | null>;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function loadCheckpoint(): Checkpoint {
  if (!existsSync(CHECKPOINT_PATH)) return {};
  return JSON.parse(readFileSync(CHECKPOINT_PATH, "utf-8")) as Checkpoint;
}

function saveCheckpoint(cp: Checkpoint): void {
  writeFileSync(CHECKPOINT_PATH, JSON.stringify(cp, null, 1));
}

async function fetchObservations(
  scientificName: string
): Promise<InatObservation[]> {
  const url =
    `${API}?taxon_name=${encodeURIComponent(scientificName)}` +
    `&photo_license=${PERMISSIVE}&quality_grade=research&photos=true` +
    `&per_page=${PER_PAGE}&order_by=votes`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      });
      if (res.status === 429 || res.status >= 500) {
        await sleep(2000 * attempt);
        continue;
      }
      if (!res.ok) return [];
      const json = (await res.json()) as { results?: InatObservation[] };
      return json.results ?? [];
    } catch {
      if (attempt === MAX_RETRIES) return [];
      await sleep(2000 * attempt);
    }
  }
  return [];
}

const birds: Bird[] = JSON.parse(readFileSync(BIRDS_PATH, "utf-8"));
const checkpoint = loadCheckpoint();

// Every photo already claimed, so no two species can share one.
const usedUrls = new Set<string>();
for (const image of Object.values(checkpoint)) {
  if (image) usedUrls.add(image.url);
}

const pending = birds
  .filter((b) => !(b.speciesCode in checkpoint))
  .slice(0, limit === Infinity ? undefined : limit);

console.log(
  `${birds.length} birds, ${Object.keys(checkpoint).length} already resolved, ${pending.length} to fetch`
);

let done = 0;
for (const bird of pending) {
  const observations = await fetchObservations(bird.scientificName);
  const picked = pickInatPhoto(observations, bird.scientificName, usedUrls);

  checkpoint[bird.speciesCode] = picked
    ? { url: picked.url, license: picked.license, artist: picked.artist }
    : null;
  if (picked) usedUrls.add(picked.url);

  done++;
  if (done % 25 === 0) {
    saveCheckpoint(checkpoint);
    console.log(`  ${done}/${pending.length}`);
  }
  await sleep(REQUEST_DELAY_MS);
}
saveCheckpoint(checkpoint);

const resolved = Object.values(checkpoint).filter(Boolean).length;
const total = Object.keys(checkpoint).length;
console.log(
  `\nresolved ${resolved}/${total} species (${total - resolved} without a permissive research-grade photo)`
);

if (dryRun) {
  console.log("--dry-run: data/birds.json left untouched");
  process.exit(0);
}

let replaced = 0;
let unplayable = 0;
for (const bird of birds) {
  const picked = checkpoint[bird.speciesCode];
  if (picked === undefined) continue; // not measured in this run
  if (picked) {
    bird.image = picked;
    bird.imageSource = "inaturalist";
    bird.playable = true;
    replaced++;
  } else {
    bird.playable = false;
    unplayable++;
  }
}

writeFileSync(BIRDS_PATH, JSON.stringify(birds, null, 2));
console.log(
  `data/birds.json updated: ${replaced} images replaced, ${unplayable} marked playable:false`
);
console.log("next: npx tsx scripts/upload-images.ts  (re-download + push to R2)");
