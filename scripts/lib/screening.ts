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

/** A species' collected candidates, with the observation count beside them. */
export type CandidateEntry = { total: number; candidates: Candidate[] };

/**
 * The species still waiting on a photograph, each with the next candidate to
 * judge, best known first.
 *
 * The visual pass is the pipeline's bottleneck — it needs eyes, twenty
 * photographs at a time — and it had been working in taxonomic order, which
 * is why the game could show a Gray Antwren but not a Mallard, a House
 * Sparrow, a Canada Goose or a Northern Cardinal. Ordering by observations
 * spends the screening on the birds a player might recognise.
 *
 * A species with an accepted photograph is done. One whose candidates have
 * all been rejected has nothing left to offer and drops out until the
 * crawler finds more.
 */
export function screeningQueue(
  entries: Record<string, CandidateEntry>,
  verdicts: Verdicts
): { code: string; candidate: Candidate }[] {
  const queue: { code: string; candidate: Candidate; total: number }[] = [];

  for (const [code, entry] of Object.entries(entries)) {
    const judged = verdicts[code] ?? [];
    if (judged.some((v) => v.ok)) continue;

    const rejected = new Set(judged.map((v) => v.url));
    const candidate = entry.candidates.find((c) => !rejected.has(c.url));
    if (candidate) queue.push({ code, candidate, total: entry.total });
  }

  return queue
    .sort((a, b) => b.total - a.total)
    .map(({ code, candidate }) => ({ code, candidate }));
}

/**
 * Contiguous sheet ranges, one per worker, for screening the sheets in
 * parallel.
 *
 * The pass is the pipeline's bottleneck and it needs eyes, so it is the one
 * step worth fanning out: each worker judges its own sheets and writes its
 * own NNNN.verdict.json, and nothing is shared until the verdicts are merged
 * centrally afterwards. Merging cannot be fanned out alongside it — every
 * worker would be rewriting the same cache and the last one would win.
 *
 * Ranges are contiguous rather than interleaved so a worker that fails can be
 * re-run over a span, and the remainder goes to the earliest workers so none
 * is left idle while another carries two extra sheets.
 */
export function sheetRanges(
  sheets: number,
  workers: number
): [number, number][] {
  const ranges: [number, number][] = [];
  const base = Math.floor(sheets / workers);
  const extra = sheets % workers;

  let start = 1;
  for (let i = 0; i < workers && start <= sheets; i++) {
    const size = base + (i < extra ? 1 : 0);
    if (size === 0) break;
    ranges.push([start, start + size - 1]);
    start += size;
  }

  return ranges;
}
