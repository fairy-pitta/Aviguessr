import type { Candidate } from "./photo-quality";

/** One cell of a contact sheet, as the visual pass decided it. */
export type CellVerdict = { cell: number; ok: boolean; reason?: string };

/** A sheet's manifest, written alongside the image when it was built. */
export type SheetManifest = { cell: number; speciesCode: string; url: string };

export type Verdict = { url: string; ok: boolean; reason?: string };
export type Verdicts = Record<string, Verdict[]>;

/**
 * Folds a sheet's verdicts into the running record, keyed by species and
 * photo url rather than by cell, because a species that is rejected comes
 * back on a later sheet with its next candidate and the cell number means
 * nothing across sheets.
 */
export function mergeVerdicts(
  verdicts: Verdicts,
  manifest: SheetManifest[],
  cells: CellVerdict[]
): Verdicts {
  const byCell = new Map(manifest.map((m) => [m.cell, m]));
  const merged: Verdicts = { ...verdicts };

  for (const cell of cells) {
    const entry = byCell.get(cell.cell);
    if (!entry) continue;
    const existing = merged[entry.speciesCode] ?? [];
    if (existing.some((v) => v.url === entry.url)) continue;
    merged[entry.speciesCode] = [
      ...existing,
      { url: entry.url, ok: cell.ok, reason: cell.reason },
    ];
  }

  return merged;
}

export type ChosenPhoto = {
  speciesCode: string;
  url: string;
  license: string;
  artist: string;
  commercial: boolean;
};

/**
 * The photograph each species ended up with: the first candidate the visual
 * pass accepted. A species with no accepted verdict is absent, which is how
 * it stays unplayable.
 */
export function chosenPhotos(
  verdicts: Verdicts,
  candidates: Record<string, { candidates: Candidate[] }>
): ChosenPhoto[] {
  const out: ChosenPhoto[] = [];

  for (const [speciesCode, judged] of Object.entries(verdicts)) {
    const accepted = judged.find((v) => v.ok);
    if (!accepted) continue;
    const candidate = candidates[speciesCode]?.candidates.find(
      (c) => c.url === accepted.url
    );
    if (!candidate) continue;
    out.push({
      speciesCode,
      url: candidate.url,
      license: candidate.license,
      artist: candidate.artist,
      commercial: candidate.commercial,
    });
  }

  return out;
}
