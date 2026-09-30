/**
 * birds.json の画像URLからダウンロードし、wrangler r2 object put で R2 にアップロード
 *
 * Usage: npx tsx scripts/upload-images.ts [--force]
 *
 * --force ignores the upload checkpoint and re-downloads every image, for when
 * the URLs in birds.json have changed (e.g. the switch to iNaturalist photos).
 * Without it, a cached local file is reused even if the URL now points
 * somewhere else, which would silently re-upload the previous image.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMAGES_DIR = resolve(__dirname, "../data/images");
const CHECKPOINT_PATH = resolve(
  __dirname,
  "../data/_cache_upload_checkpoint.json"
);
const DOWNLOAD_DELAY_MS = 500; // Wikimedia rate limit 対策
const CONCURRENCY = 8; // wrangler spends ~2s per object on process start-up
const MAX_RETRIES = 3;

type BirdEntry = {
  speciesCode: string;
  name: string;
  playable?: boolean;
  image: {
    url: string;
    license: string;
    artist: string;
  };
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function loadCheckpoint(): Set<string> {
  if (existsSync(CHECKPOINT_PATH)) {
    const data = JSON.parse(readFileSync(CHECKPOINT_PATH, "utf-8"));
    return new Set(data as string[]);
  }
  return new Set();
}

function saveCheckpoint(uploaded: Set<string>): void {
  writeFileSync(CHECKPOINT_PATH, JSON.stringify([...uploaded]));
}

async function downloadImage(
  url: string,
  dest: string
): Promise<boolean> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "AviGuessr/1.0 (https://github.com/aviguessr; bird quiz game)",
        },
        redirect: "follow",
      });

      if (res.status === 429) {
        const wait = attempt * 2000;
        console.warn(`    429 rate limit, waiting ${wait}ms...`);
        await sleep(wait);
        continue;
      }

      if (!res.ok) {
        console.warn(`    HTTP ${res.status} for ${url.slice(0, 80)}...`);
        return false;
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 100) {
        console.warn(`    Suspiciously small (${buffer.length}B), skipping`);
        return false;
      }

      writeFileSync(dest, buffer);
      return true;
    } catch (e) {
      if (attempt === MAX_RETRIES) return false;
      await sleep(1000 * attempt);
    }
  }
  return false;
}

function uploadToR2(localPath: string, r2Key: string): boolean {
  try {
    execSync(
      `./node_modules/.bin/wrangler r2 object put aviguessr-images/${r2Key} --file="${localPath}" --content-type="image/jpeg" --remote`,
      { stdio: "pipe", timeout: 30000 }
    );
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const birdsPath = resolve(__dirname, "../data/birds.json");
  const birds: BirdEntry[] = JSON.parse(readFileSync(birdsPath, "utf-8"));

  if (!existsSync(IMAGES_DIR)) {
    mkdirSync(IMAGES_DIR, { recursive: true });
  }

  const force = process.argv.slice(2).includes("--force");
  const uploaded = force ? new Set<string>() : loadCheckpoint();
  // playable:false species are never served, so their image is not worth fetching
  const remaining = birds.filter(
    (b) => b.playable !== false && !uploaded.has(b.speciesCode)
  );

  console.log(
    force
      ? `画像アップロード(--force): ${birds.length}件すべて再取得`
      : `画像アップロード: ${birds.length}件中 ${uploaded.size}件済み, ${remaining.length}件残り`
  );

  let done = 0;
  let failed = 0;

  // Each bird is independent, and most of the wall-clock is wrangler's start-up,
  // so run a small pool rather than one at a time.
  let cursor = 0;
  async function processOne(bird: BirdEntry): Promise<void> {
    const r2Key = `birds/${bird.speciesCode}.jpg`;
    const localPath = resolve(IMAGES_DIR, `${bird.speciesCode}.jpg`);

    // Download if not cached locally (--force always re-fetches, since a
    // cached file may predate a URL change)
    let downloadOk = !force && existsSync(localPath);
    if (!downloadOk) {
      downloadOk = await downloadImage(bird.image.url, localPath);
      await sleep(DOWNLOAD_DELAY_MS);
    }

    if (!downloadOk) {
      console.warn(`  [skip] ${bird.speciesCode} (${bird.name}) — download failed`);
      failed++;
      return;
    }

    // Upload to R2
    const uploadOk = uploadToR2(localPath, r2Key);
    if (!uploadOk) {
      console.warn(`  [skip] ${bird.speciesCode} (${bird.name}) — upload failed`);
      failed++;
      return;
    }

    uploaded.add(bird.speciesCode);
    done++;

    if (uploaded.size % 25 === 0) {
      console.log(`  ${uploaded.size}/${remaining.length} 完了`);
      saveCheckpoint(uploaded);
    }
  }

  async function worker(): Promise<void> {
    while (cursor < remaining.length) {
      const bird = remaining[cursor++];
      await processOne(bird);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, remaining.length) }, worker)
  );

  // Final checkpoint
  saveCheckpoint(uploaded);
  console.log(`\n完了: ${done}件アップロード, ${failed}件失敗`);

  if (failed === 0 && existsSync(CHECKPOINT_PATH)) {
    unlinkSync(CHECKPOINT_PATH);
    console.log("チェックポイント削除");
  }
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n中断 — チェックポイントは最終保存時点まで有効");
  process.exit(130);
});

main().catch((e) => {
  console.error("エラー:", e);
  process.exit(1);
});
