/**
 * The species name as it appears while the question is still open.
 *
 * Hiding the name altogether is what made the game unfair. A photograph of a
 * Crested Quetzal and one of a Resplendent Quetzal are the same picture to
 * anyone but a specialist, and they live on opposite sides of a continent;
 * a Southern Nutcracker and a Northern Nutcracker likewise, one Himalayan
 * and one reaching Japan. A player who knew exactly what they were looking
 * at was marked wrong for it. The name settles which of the pair it is.
 *
 * A name can also be the answer, though: an Australian Brushturkey lives in
 * Australia and nowhere else. A place word only gives the answer away when
 * the range is narrow enough for it to point at a country — "Eurasian" over
 * 151 countries points at nothing a player can click — so it is inked out
 * only then.
 */

/** What a place word is replaced with, as a word struck through in ink. */
export const REDACTION = "████";

/**
 * Below this many countries, a place in the name is close enough to the
 * answer to be worth hiding. No species the game can currently show is
 * affected: the narrowest range among the 193 playable birds whose name
 * carries a place is 15 countries... and the Mongolian Gull's "Mongolian"
 * still only points at the middle of its range. The guard is here for the
 * pool as photography fills it in — 421 species in the world list name a
 * place and live in three countries or fewer.
 */
const NARROW_RANGE = 20;

/**
 * Words in bird names that name somewhere. Continents, oceans, regions and
 * the adjectives made from countries — the forms that actually turn up in
 * English bird names, not every demonym there is.
 */
const PLACE_WORDS = [
  "African", "Amazonian", "American", "Andean", "Antarctic", "Arabian",
  "Arctic", "Argentine", "Asian", "Atlantic", "Australasian", "Australian",
  "Austral", "Balkan", "Bornean", "Brazilian", "Burmese", "Canadian",
  "Cape", "Caribbean", "Caspian", "Caucasian", "Chilean", "Chinese",
  "Colombian", "Cuban", "Ecuadorian", "Egyptian", "Ethiopian", "Eurasian",
  "European", "Falkland", "Galapagos", "Hawaiian", "Himalayan", "Iberian",
  "Indian", "Indochinese", "Indonesian", "Japanese", "Javan", "Kenyan",
  "Korean", "Madagascar", "Malagasy", "Malaysian", "Mediterranean",
  "Mexican", "Moluccan", "Mongolian", "Nepal", "Nubian", "Oriental",
  "Pacific", "Palestine", "Patagonian", "Persian", "Peruvian", "Philippine",
  "Polynesian", "Siberian", "Somali", "Sumatran", "Sundaic", "Tibetan",
  "Venezuelan", "Vietnamese",
];

/*
 * Word boundaries on both sides, so "Indian" does not strike the middle of
 * "Scandinavian". A hyphen counts as a boundary, which is what lets
 * "African Grass-Owl" lose only its first word.
 */
const PLACE = new RegExp(`\\b(?:${PLACE_WORDS.join("|")})\\b`, "gi");

export function questionName(name: string, rangeSize: number): string {
  if (rangeSize >= NARROW_RANGE) return name;
  return name.replace(PLACE, REDACTION);
}
