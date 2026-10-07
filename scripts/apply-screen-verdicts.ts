/**
 * Folds the visual pass's decisions back into the candidate record.
 *
 * Each contact sheet has a manifest written beside it when it was built, and
 * a verdict file written beside that by whoever screened it:
 *
 *   data/screen-sheets/0001.json          manifest  (cell -> species, url)
 *   data/screen-sheets/0001.verdict.json  verdicts  [{cell, ok, reason?}]
 *
 * Rejections are remembered per photo url, so re-running build:screen-sheets
 * offers each rejected species its next candidate instead of the same one.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { mergeVerdicts, type CellVerdict, type SheetManifest, type Verdicts } from "./lib/screening";

const SHEETS = "data/screen-sheets";
const VERDICTS = "data/_cache_photo_verdicts.json";

let verdicts: Verdicts = existsSync(VERDICTS)
  ? JSON.parse(readFileSync(VERDICTS, "utf8"))
  : {};

const files = readdirSync(SHEETS).filter((f) => f.endsWith(".verdict.json")).sort();
if (files.length === 0) {
  console.error(`no *.verdict.json in ${SHEETS}`);
  process.exit(1);
}

let applied = 0;
for (const file of files) {
  const sheet = file.replace(".verdict.json", "");
  const manifestPath = `${SHEETS}/${sheet}.json`;
  if (!existsSync(manifestPath)) {
    console.error(`[skip] ${file}: no manifest ${sheet}.json`);
    continue;
  }
  const manifest: SheetManifest[] = JSON.parse(readFileSync(manifestPath, "utf8"));
  const cells: CellVerdict[] = JSON.parse(readFileSync(`${SHEETS}/${file}`, "utf8"));
  verdicts = mergeVerdicts(verdicts, manifest, cells);
  applied += cells.length;
}

writeFileSync(VERDICTS, JSON.stringify(verdicts));

const judged = Object.values(verdicts).flat();
const accepted = Object.values(verdicts).filter((v) => v.some((x) => x.ok)).length;
console.log(
  `${files.length} sheets, ${applied} cells applied. ` +
    `${Object.keys(verdicts).length} species judged, ${accepted} have a photograph, ` +
    `${judged.length - judged.filter((v) => v.ok).length} photographs rejected`
);
