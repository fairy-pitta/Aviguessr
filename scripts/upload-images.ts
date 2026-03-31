/**
 * birds.json の画像URLからダウンロードし、wrangler r2 object put で R2 にアップロード
 *
 * Usage: npx tsx scripts/upload-images.ts
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
const MAX_RETRIES = 3;

type BirdEntry = {
  speciesCode: string;
  name: string;
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
      `npx wrangler r2 object put aviguessr-images/${r2Key} --file="${localPath}" --content-type="image/jpeg"`,
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

  const uploaded = loadCheckpoint();
  const remaining = birds.filter((b) => !uploaded.has(b.speciesCode));

  console.log(
    `画像アップロード: ${birds.length}件中 ${uploaded.size}件済み, ${remaining.length}件残り`
  );

  let done = 0;
  let failed = 0;

  for (let i = 0; i < remaining.length; i++) {
    const bird = remaining[i];
    const r2Key = `birds/${bird.speciesCode}.jpg`;
    const localPath = resolve(IMAGES_DIR, `${bird.speciesCode}.jpg`);

    // Download if not cached locally
    let downloadOk = existsSync(localPath);
    if (!downloadOk) {
      downloadOk = await downloadImage(bird.image.url, localPath);
      await sleep(DOWNLOAD_DELAY_MS);
    }

    if (!downloadOk) {
      console.warn(`  [skip] ${bird.speciesCode} (${bird.name}) — download failed`);
      failed++;
      continue;
    }

    // Upload to R2
    const uploadOk = uploadToR2(localPath, r2Key);
    if (!uploadOk) {
      console.warn(`  [skip] ${bird.speciesCode} (${bird.name}) — upload failed`);
      failed++;
      continue;
    }

    uploaded.add(bird.speciesCode);
    done++;

    const total = uploaded.size;
    if (total % 10 === 0 || i === remaining.length - 1) {
      console.log(`  ${total}/${birds.length} 完了`);
      saveCheckpoint(uploaded);
    }
  }

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
