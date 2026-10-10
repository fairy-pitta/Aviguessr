/**
 * Puts the screened photographs into R2 and writes the SQL that points the
 * database at them.
 *
 * Downloads iNaturalist's 1024px rendition and re-encodes it to WebP, which
 * is both sharper and smaller than the 500px JPEG the old pipeline served:
 * the plate is shown full bleed across half a large screen, where 500px is
 * visibly soft.
 *
 *   npm run upload:photos -- --dry-run   encode only, no R2, no auth needed
 *   npm run upload:photos                upload (needs `wrangler login`)
 *   npm run upload:photos -- --all-sql   re-emit SQL for every photograph
 *
 * The SQL covers only what this run uploaded. Re-emitting the whole record
 * to apply a handful of new photographs is how a day's worth of D1 row
 * writes went on rewriting rows that already held the right values.
 */
import { execFile } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { promisify } from "node:util";
import sharp from "sharp";
import { chosenPhotos, photoUpdates, type Verdicts } from "./lib/screening";
import type { Candidate } from "./lib/photo-quality";

const run = promisify(execFile);

const CANDIDATES = "data/_cache_photo_candidates.json";
const VERDICTS = "data/_cache_photo_verdicts.json";
const UPLOADED = "data/_cache_uploaded_photos.json";
const TMP = "data/photo-tmp";
const SQL_OUT = "data/update-photos.sql";
const BUCKET = "aviguessr-images";
/** Most of the wall clock is wrangler's start-up, so these run in parallel. */
const CONCURRENCY = 8;
const LONG_SIDE = 1024;
const SAVE_EVERY = 20;

const dryRun = process.argv.includes("--dry-run");
/** Rebuild the SQL for every photograph, for a database being reloaded. */
const allSql = process.argv.includes("--all-sql");

const candidates: Record<string, { candidates: Candidate[] }> = JSON.parse(
  readFileSync(CANDIDATES, "utf8")
);
const verdicts: Verdicts = JSON.parse(readFileSync(VERDICTS, "utf8"));
const uploaded: Record<string, { key: string; license: string; artist: string; bytes: number }> =
  existsSync(UPLOADED) ? JSON.parse(readFileSync(UPLOADED, "utf8")) : {};

const chosen = chosenPhotos(verdicts, candidates).filter((c) => !uploaded[c.speciesCode]);
mkdirSync(TMP, { recursive: true });

console.log(
  `${chosen.length} photographs to ${dryRun ? "encode" : "upload"}` +
    ` (${Object.keys(uploaded).length} already done)`
);

let done = 0;
let failed = 0;
let bytes = 0;
/**
 * The record is of what is in the bucket, so a dry run must not write it. It
 * used to, which marked all 956 photographs done without a single byte
 * reaching R2, and the next real run then had nothing left to do.
 */
const save = () => {
  if (dryRun) return;
  writeFileSync(`${UPLOADED}.tmp`, JSON.stringify(uploaded));
  renameSync(`${UPLOADED}.tmp`, UPLOADED);
};

async function handle(photo: (typeof chosen)[number]) {
  const key = `birds/${photo.speciesCode}.webp`;
  const local = `${TMP}/${photo.speciesCode}.webp`;

  const res = await fetch(photo.url, {
    headers: { "User-Agent": "AviGuessr/upload-photos" },
  });
  if (!res.ok) throw new Error(`download http ${res.status}`);

  const encoded = await sharp(Buffer.from(await res.arrayBuffer()))
    .rotate()
    .resize(LONG_SIDE, LONG_SIDE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  writeFileSync(local, encoded);

  if (!dryRun) {
    await run("./node_modules/.bin/wrangler", [
      "r2", "object", "put", `${BUCKET}/${key}`,
      "--file", local, "--content-type", "image/webp", "--remote",
    ]);
  }

  // Held in memory either way, because the SQL is written from it and a dry
  // run is how that SQL gets checked; only persisting it is gated above.
  uploaded[photo.speciesCode] = {
    key,
    license: photo.license,
    artist: photo.artist,
    bytes: encoded.length,
  };
  bytes += encoded.length;
}

let cursor = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < chosen.length) {
      const photo = chosen[cursor++];
      try {
        await handle(photo);
      } catch (e) {
        failed++;
        console.error(`[fail] ${photo.speciesCode}: ${String(e).slice(0, 90)}`);
      }
      done++;
      if (done % SAVE_EVERY === 0) {
        save();
        console.log(`${done}/${chosen.length} — ${(bytes / 1e6).toFixed(0)} MB encoded`);
      }
    }
  })
);
save();

const written = allSql
  ? Object.keys(uploaded)
  : chosen.map((c) => c.speciesCode).filter((code) => code in uploaded);
const updates = photoUpdates(uploaded, written);
writeFileSync(SQL_OUT, updates.length ? updates.join("\n") + "\n" : "");

const total = Object.values(uploaded).reduce((n, u) => n + u.bytes, 0);
console.log(
  `${done} handled, ${failed} failed. ${Object.keys(uploaded).length} photographs, ` +
    `${(total / 1e9).toFixed(2)} GB. ${updates.length} UPDATE(s) written to ${SQL_OUT}`
);
