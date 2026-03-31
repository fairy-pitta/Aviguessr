/**
 * BirdGuessr データ収集スクリプト
 *
 * Usage:
 *   EBIRD_API_KEY=xxx npx tsx scripts/collect-birds.ts
 *
 * Steps:
 *   1. eBird API から全国の地域コード取得
 *   2. 国ごとの種リスト取得 → 転置して 種→国[] マッピング
 *   3. eBird taxonomy で種の詳細情報取得
 *   4. Wikimedia Commons で CC ライセンス画像取得
 *   5. data/birds.json に出力
 *
 * 中間データは data/ に保存。再実行時はキャッシュを使う。
 */

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const EBIRD_API_KEY = process.env.EBIRD_API_KEY;
if (!EBIRD_API_KEY) {
  console.error("EBIRD_API_KEY が設定されていません");
  console.error("取得: https://ebird.org/api/keygen");
  console.error("実行: EBIRD_API_KEY=xxx npx tsx scripts/collect-birds.ts");
  process.exit(1);
}

const DATA_DIR = join(new URL(".", import.meta.url).pathname, "..", "data");
const EBIRD_BASE = "https://api.ebird.org/v2";
const RATE_LIMIT_MS = 200; // eBird API rate limit対策

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function cachePath(name: string): string {
  return join(DATA_DIR, `_cache_${name}.json`);
}

function loadCache<T>(name: string): T | null {
  const p = cachePath(name);
  if (existsSync(p)) {
    console.log(`  [cache hit] ${name}`);
    return JSON.parse(readFileSync(p, "utf-8"));
  }
  return null;
}

function saveCache(name: string, data: unknown): void {
  writeFileSync(cachePath(name), JSON.stringify(data, null, 2));
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function ebirdGet<T>(path: string): Promise<T> {
  const res = await fetch(`${EBIRD_BASE}${path}`, {
    headers: { "x-ebirdapitoken": EBIRD_API_KEY! },
  });
  if (!res.ok) {
    throw new Error(`eBird API error: ${res.status} ${res.statusText} - ${path}`);
  }
  return res.json() as Promise<T>;
}

async function wikiCommonsImageSearch(
  scientificName: string
): Promise<{ url: string; license: string; artist: string } | null> {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrnamespace: "6", // File namespace
    gsrsearch: `"${scientificName}" bird`,
    gsrlimit: "5",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "640",
    format: "json",
  });

  const res = await fetch(
    `https://commons.wikimedia.org/w/api.php?${params.toString()}`
  );
  if (!res.ok) return null;

  const data = await res.json();
  const pages = data?.query?.pages;
  if (!pages) return null;

  // CC ライセンスの画像を優先的に探す
  for (const page of Object.values(pages) as any[]) {
    const info = page?.imageinfo?.[0];
    if (!info) continue;

    const meta = info.extmetadata ?? {};
    const license = meta?.LicenseShortName?.value ?? "";
    const artist = meta?.Artist?.value ?? "";

    // CC or Public Domain のみ
    if (
      license.includes("CC") ||
      license.includes("Public domain") ||
      license.includes("PD")
    ) {
      return {
        url: info.thumburl ?? info.url,
        license,
        artist: artist.replace(/<[^>]*>/g, "").trim(), // HTMLタグ除去
      };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Step 1: 国リスト取得
// ---------------------------------------------------------------------------

type EBirdRegion = { code: string; name: string };

async function fetchCountries(): Promise<EBirdRegion[]> {
  const cached = loadCache<EBirdRegion[]>("countries");
  if (cached) return cached;

  console.log("Step 1: 国リスト取得中...");
  const countries = await ebirdGet<EBirdRegion[]>(
    "/ref/region/list/country/world"
  );
  console.log(`  ${countries.length} 国取得`);
  saveCache("countries", countries);
  return countries;
}

// ---------------------------------------------------------------------------
// Step 2: 国別種リスト → 転置
// ---------------------------------------------------------------------------

type SpeciesCountryMap = Record<string, string[]>; // speciesCode → countryCode[]

async function fetchSpeciesByCountry(
  countries: EBirdRegion[]
): Promise<SpeciesCountryMap> {
  const cached = loadCache<SpeciesCountryMap>("species_country_map");
  if (cached) return cached;

  console.log("Step 2: 国別種リスト取得中...");
  const map: SpeciesCountryMap = {};
  let done = 0;

  for (const country of countries) {
    try {
      const species = await ebirdGet<string[]>(
        `/product/spplist/${country.code}`
      );
      for (const sp of species) {
        if (!map[sp]) map[sp] = [];
        map[sp].push(country.code);
      }
      done++;
      if (done % 20 === 0) {
        console.log(`  ${done}/${countries.length} 国完了`);
      }
      await sleep(RATE_LIMIT_MS);
    } catch (e) {
      console.warn(`  [skip] ${country.code} (${country.name}): ${e}`);
    }
  }

  console.log(`  ${Object.keys(map).length} 種の国マッピング完了`);
  saveCache("species_country_map", map);
  return map;
}

// ---------------------------------------------------------------------------
// Step 3: ゲーム向きの鳥をフィルタ
// ---------------------------------------------------------------------------

type TaxonomyEntry = {
  speciesCode: string;
  sciName: string;
  comName: string;
  familyComName: string;
  familySciName: string;
  order: string;
};

async function fetchTaxonomy(): Promise<TaxonomyEntry[]> {
  const cached = loadCache<TaxonomyEntry[]>("taxonomy");
  if (cached) return cached;

  console.log("Step 3: taxonomy 取得中...");
  const taxonomy = await ebirdGet<TaxonomyEntry[]>(
    "/ref/taxonomy/ebird?fmt=json"
  );
  console.log(`  ${taxonomy.length} 種取得`);
  saveCache("taxonomy", taxonomy);
  return taxonomy;
}

function selectGameBirds(
  speciesMap: SpeciesCountryMap,
  taxonomy: TaxonomyEntry[]
): TaxonomyEntry[] {
  // 難易度: 分布国数が少ないほど難しい
  //   hard:   1-3国  — ピンポイントで知ってないと無理
  //   medium: 4-10国 — 地域知識があれば絞れる
  //   easy:   11+国  — 広域分布、当たりやすい

  const taxMap = new Map(taxonomy.map((t) => [t.speciesCode, t]));

  const candidates: { entry: TaxonomyEntry; countryCount: number }[] = [];

  for (const [code, countries] of Object.entries(speciesMap)) {
    const entry = taxMap.get(code);
    if (!entry) continue;

    const n = countries.length;
    // 100カ国超はゲームとして成立しない（どこ押しても当たる）ので除外
    if (n >= 1 && n <= 100) {
      candidates.push({ entry, countryCount: n });
    }
  }

  const hard = candidates.filter((c) => c.countryCount <= 3);
  const medium = candidates.filter(
    (c) => c.countryCount >= 4 && c.countryCount <= 10
  );
  const easy = candidates.filter(
    (c) => c.countryCount >= 11 && c.countryCount <= 100
  );

  const selected = [...hard, ...medium, ...easy];

  console.log(
    `  フィルタ結果: hard=${hard.length}(1-3国), medium=${medium.length}(4-10国), easy=${easy.length}(11+国)`
  );
  console.log(`  全 ${selected.length} 種を処理`);

  return selected.map((s) => s.entry);
}

// ---------------------------------------------------------------------------
// Step 4: Wikimedia Commons から画像取得
// ---------------------------------------------------------------------------

type BirdData = {
  speciesCode: string;
  name: string;
  scientificName: string;
  family: string;
  countries: string[];
  difficulty: "easy" | "medium" | "hard";
  image: {
    url: string;
    license: string;
    artist: string;
  } | null;
};

async function enrichWithImages(
  birds: TaxonomyEntry[],
  speciesMap: SpeciesCountryMap
): Promise<BirdData[]> {
  const cached = loadCache<BirdData[]>("birds_with_images");
  if (cached) return cached;

  console.log("Step 4: Wikimedia Commons から画像取得中...");
  const results: BirdData[] = [];

  for (let i = 0; i < birds.length; i++) {
    const bird = birds[i];
    const countries = speciesMap[bird.speciesCode] ?? [];
    const countryCount = countries.length;
    const difficulty: BirdData["difficulty"] =
      countryCount <= 3 ? "hard" : countryCount <= 10 ? "medium" : "easy";

    const image = await wikiCommonsImageSearch(bird.sciName);
    if (image) {
      results.push({
        speciesCode: bird.speciesCode,
        name: bird.comName,
        scientificName: bird.sciName,
        family: bird.familyComName,
        countries,
        difficulty,
        image,
      });
    }

    if ((i + 1) % 10 === 0) {
      console.log(
        `  ${i + 1}/${birds.length} 完了 (画像あり: ${results.length})`
      );
    }
    await sleep(300); // Wikimedia rate limit
  }

  console.log(`  画像付き: ${results.length}/${birds.length} 種`);
  saveCache("birds_with_images", results);
  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== BirdGuessr データ収集 ===\n");

  // Step 1
  const countries = await fetchCountries();

  // Step 2
  const speciesMap = await fetchSpeciesByCountry(countries);

  // Step 3
  const taxonomy = await fetchTaxonomy();
  const gameBirds = selectGameBirds(speciesMap, taxonomy);

  // Step 4
  const birdsWithImages = await enrichWithImages(gameBirds, speciesMap);

  // 最終出力
  const output = birdsWithImages.filter((b) => b.image !== null);
  const outputPath = join(DATA_DIR, "birds.json");
  writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`\n=== 完了 ===`);
  console.log(`${output.length} 種を ${outputPath} に出力`);
  console.log(
    `内訳: easy=${output.filter((b) => b.difficulty === "easy").length}, ` +
      `medium=${output.filter((b) => b.difficulty === "medium").length}, ` +
      `hard=${output.filter((b) => b.difficulty === "hard").length}`
  );
}

main().catch((e) => {
  console.error("エラー:", e);
  process.exit(1);
});
