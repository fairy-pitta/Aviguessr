/**
 * Lays the leading candidate for each species out on contact sheets, so the
 * question "is this a good enough plate?" can be asked of twenty photographs
 * at a time instead of one.
 *
 * The screen has to be a visual one. Measuring 33 photographs showed the
 * cheap metrics cannot do it: Laplacian variance ranked a flock of sparrows,
 * a nest of chicks and a bird beside a human foot as the sharpest pictures in
 * the sample. What separates a plate from a snapshot — one bird, large in
 * frame, unobstructed, no people — needs eyes.
 *
 * Thumbnails come from iNaturalist's 240px rendition, which is a tenth of the
 * bandwidth of the full-size file and plenty to judge composition by.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import type { Candidate } from "./lib/photo-quality";

const CANDIDATES = "data/_cache_photo_candidates.json";
const VERDICTS = "data/_cache_photo_verdicts.json";
const OUT_DIR = "data/screen-sheets";

const COLS = 5;
const ROWS = 4;
const CELL_W = 260;
const CELL_H = 200;
const LABEL_H = 22;
const CONCURRENCY = 8;

type Entry = { taxonId: number | null; candidates: Candidate[]; total: number };
/** Per species, the photo urls already judged and what was decided. */
type Verdicts = Record<string, { url: string; ok: boolean; reason?: string }[]>;

const entries: Record<string, Entry> = JSON.parse(readFileSync(CANDIDATES, "utf8"));
const verdicts: Verdicts = existsSync(VERDICTS)
  ? JSON.parse(readFileSync(VERDICTS, "utf8"))
  : {};

/** The next candidate for a species: unjudged, and only if none was accepted. */
function nextCandidate(code: string, entry: Entry): Candidate | null {
  const judged = verdicts[code] ?? [];
  if (judged.some((v) => v.ok)) return null;
  const rejected = new Set(judged.map((v) => v.url));
  return entry.candidates.find((c) => !rejected.has(c.url)) ?? null;
}

const queue: { code: string; candidate: Candidate }[] = [];
for (const [code, entry] of Object.entries(entries)) {
  const candidate = nextCandidate(code, entry);
  if (candidate) queue.push({ code, candidate });
}

console.log(`${queue.length} species need a photograph screened`);
if (queue.length === 0) process.exit(0);

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

async function thumbnail(candidate: Candidate, label: string): Promise<Buffer> {
  const url = candidate.url.replace(/\/large\./, "/small.");
  const res = await fetch(url, { headers: { "User-Agent": "AviGuessr/screen-sheets" } });
  if (!res.ok) throw new Error(`http ${res.status}`);
  const photo = await sharp(Buffer.from(await res.arrayBuffer()))
    .resize(CELL_W, CELL_H - LABEL_H, { fit: "contain", background: "#111" })
    .toBuffer();

  // The number is how a verdict refers back to a cell
  const caption = Buffer.from(
    `<svg width="${CELL_W}" height="${LABEL_H}">
       <rect width="${CELL_W}" height="${LABEL_H}" fill="#1b2a28"/>
       <text x="6" y="16" font-family="monospace" font-size="14" fill="#edefea">${label}</text>
     </svg>`
  );
  return sharp({
    create: { width: CELL_W, height: CELL_H, channels: 3, background: "#111" },
  })
    .composite([
      { input: photo, left: 0, top: 0 },
      { input: caption, left: 0, top: CELL_H - LABEL_H },
    ])
    .jpeg({ quality: 82 })
    .toBuffer();
}

const PER_SHEET = COLS * ROWS;
let sheetIndex = 0;
let failures = 0;

for (let start = 0; start < queue.length; start += PER_SHEET) {
  const batch = queue.slice(start, start + PER_SHEET);
  const tiles: (Buffer | null)[] = new Array(batch.length).fill(null);

  let cursor = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (cursor < batch.length) {
        const i = cursor++;
        try {
          tiles[i] = await thumbnail(batch[i].candidate, String(i + 1));
        } catch {
          failures++;
        }
      }
    })
  );

  const present = batch
    .map((item, i) => ({ item, tile: tiles[i], cell: i + 1 }))
    .filter((t) => t.tile);
  if (present.length === 0) continue;

  sheetIndex++;
  const name = String(sheetIndex).padStart(4, "0");
  await sharp({
    create: {
      width: CELL_W * COLS,
      height: CELL_H * ROWS,
      channels: 3,
      background: "#111",
    },
  })
    .composite(
      present.map(({ tile, cell }) => ({
        input: tile!,
        left: ((cell - 1) % COLS) * CELL_W,
        top: Math.floor((cell - 1) / COLS) * CELL_H,
      }))
    )
    .jpeg({ quality: 84 })
    .toFile(`${OUT_DIR}/${name}.jpg`);

  writeFileSync(
    `${OUT_DIR}/${name}.json`,
    JSON.stringify(
      present.map(({ item, cell }) => ({
        cell,
        speciesCode: item.code,
        url: item.candidate.url,
      })),
      null,
      1
    )
  );

  if (sheetIndex % 20 === 0) console.log(`${sheetIndex} sheets written`);
}

console.log(
  `${OUT_DIR}: ${sheetIndex} sheets of up to ${PER_SHEET}, ${failures} thumbnails failed`
);
