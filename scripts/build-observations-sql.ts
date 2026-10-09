/**
 * Writes the observation counts collected by the photo crawler into SQL.
 *
 * data/_cache_photo_candidates.json records, per species, how many
 * research-grade observations iNaturalist reported. That number is what the
 * round picker uses to tell a bird people know from a bird people do not.
 *
 * A count of -1 marks a request that was never answered; those are left at
 * the column default rather than written as zero, so a later crawl can fill
 * them in without having to tell the two apart.
 *
 *   npm run build:observations-sql
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const CANDIDATES = "data/_cache_photo_candidates.json";
const OUT_DIR = "data/observations";
/* `d1 execute --file` posts the whole file in one request; 9 MB is rejected. */
const BYTES_PER_FILE = 400_000;

const entries: Record<string, { total: number }> = JSON.parse(
  readFileSync(CANDIDATES, "utf8")
);

const statements = Object.entries(entries)
  .filter(([, e]) => e.total >= 0)
  .map(
    ([code, e]) =>
      `UPDATE birds SET observations=${e.total} WHERE species_code='${code.replace(/'/g, "''")}';`
  );

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

let file = 1;
let buffer: string[] = [];
let bytes = 0;
const flush = () => {
  if (buffer.length === 0) return;
  writeFileSync(
    `${OUT_DIR}/${String(file).padStart(3, "0")}.sql`,
    buffer.join("\n") + "\n"
  );
  file += 1;
  buffer = [];
  bytes = 0;
};

for (const s of statements) {
  if (bytes + s.length > BYTES_PER_FILE) flush();
  buffer.push(s);
  bytes += s.length + 1;
}
flush();

console.log(
  `${statements.length} species with a count, written to ${OUT_DIR} in ${file - 1} file(s)`
);
console.log(
  `${Object.keys(entries).length - statements.length} left at the default (never answered)`
);
