/**
 * Push the image metadata in data/birds.json to D1.
 *
 * The R2 object key stays `birds/<speciesCode>.jpg`, so only the credit and
 * the playable flag change when images are re-sourced.
 *
 * Usage: npx tsx scripts/apply-image-metadata.ts [--dry-run]
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SQL_PATH = resolve(__dirname, "../data/update-image-metadata.sql");
const dryRun = process.argv.slice(2).includes("--dry-run");

type Bird = {
  speciesCode: string;
  playable?: boolean;
  image: { license: string; artist: string };
};

function escapeSql(s: string): string {
  return s.replace(/'/g, "''");
}

const birds: Bird[] = JSON.parse(
  readFileSync(resolve(__dirname, "../data/birds.json"), "utf-8")
);

const sqls = birds.map((b) => {
  const playable = b.playable === false ? 0 : 1;
  return (
    `UPDATE birds SET image_license='${escapeSql(b.image.license)}', ` +
    `image_artist='${escapeSql(b.image.artist)}', playable=${playable} ` +
    `WHERE species_code='${escapeSql(b.speciesCode)}';`
  );
});

writeFileSync(SQL_PATH, sqls.join("\n"));
const unplayable = birds.filter((b) => b.playable === false).length;
console.log(
  `${sqls.length} UPDATE statements written (${birds.length - unplayable} playable, ${unplayable} excluded)`
);

if (dryRun) {
  console.log("--dry-run: nothing sent to D1");
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
  console.error("Failed. Run manually:");
  console.error(
    `  npx wrangler d1 execute aviguessr-db --remote --file=${SQL_PATH}`
  );
  process.exit(1);
}
