/**
 * Helpers for turning a Wikipedia page summary into a one-line fun fact.
 * Kept separate from the fetch script so the text handling is unit-testable.
 */

const MAX_LENGTH = 240;
const MIN_LENGTH = 25;

/** Tokens that end in "." without ending a sentence. */
const ABBREVIATIONS = new Set([
  "mt",
  "st",
  "dr",
  "cf",
  "ca",
  "etc",
  "subsp",
  "ssp",
  "var",
  "spp",
  "no",
  "vol",
]);

/** Wikipedia disambiguation pages read as facts but carry no information. */
const DISAMBIGUATION = /\b(may|can|might)\s+(also\s+)?refer to\b/i;

/**
 * Page titles to try, best first: the scientific name, its binomial if the
 * name is a trinomial (subspecies pages rarely exist), then the common name.
 */
export function titleCandidates(
  scientificName: string,
  commonName: string
): string[] {
  const candidates = [scientificName];

  const parts = scientificName.trim().split(/\s+/);
  if (parts.length === 3) {
    candidates.push(`${parts[0]} ${parts[1]}`);
  }

  candidates.push(commonName);

  return [...new Set(candidates.map((c) => c.trim()).filter(Boolean))];
}

/**
 * First sentence of `text`, tolerating the initials and abbreviations that
 * litter taxonomic prose ("described by C. W. Richmond in 1902.").
 */
export function firstSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const terminator = /[.!?](?=\s+[A-Z(])/g;
  let match: RegExpExecArray | null;

  while ((match = terminator.exec(trimmed)) !== null) {
    const token = trimmed.slice(0, match.index).split(/\s+/).pop() ?? "";

    // A single letter is an initial, not a sentence end.
    if (token.length <= 1) continue;
    if (ABBREVIATIONS.has(token.toLowerCase())) continue;

    return trimmed.slice(0, match.index + 1);
  }

  return trimmed;
}

/**
 * The fun fact for a Wikipedia extract, or null when the extract is a
 * disambiguation page or too thin to be worth showing.
 */
export function pickFunFact(extract: string): string | null {
  const sentence = firstSentence(extract);

  if (sentence.length < MIN_LENGTH) return null;
  if (DISAMBIGUATION.test(extract)) return null;
  if (sentence.length <= MAX_LENGTH) return sentence;

  const cut = sentence.slice(0, MAX_LENGTH - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const body = (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(
    /[,;:.\s]+$/,
    ""
  );

  return `${body}…`;
}
