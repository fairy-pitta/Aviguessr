-- The world list, not a sample of it: 11,167 species instead of 939.
--
-- The identification ladder needs its own indexed columns. Scoring an answer
-- by how far it narrows the field means counting species per order, family,
-- genus and group word on every guess, so these cannot be derived at read
-- time.
--
-- image_key stays NOT NULL and imageless species carry an empty string.
-- Relaxing it would mean rebuilding the table, and dropping `birds` breaks
-- the foreign keys in bird_countries and game_rounds — D1 rejects that even
-- with PRAGMA defer_foreign_keys, which was verified against a local D1.
-- `playable` is the real gate (playable = 1 means an image exists) and every
-- reader already checks it, so the empty string is never read.

ALTER TABLE birds ADD COLUMN genus TEXT;
ALTER TABLE birds ADD COLUMN group_word TEXT;
ALTER TABLE birds ADD COLUMN family_sci TEXT;
ALTER TABLE birds ADD COLUMN taxon_order TEXT;
-- Denormalised: selection and scoring both read range breadth constantly
ALTER TABLE birds ADD COLUMN range_size INTEGER NOT NULL DEFAULT 0;

-- Rungs of the ladder: each index backs a "how many species share this?" count
CREATE INDEX IF NOT EXISTS idx_birds_group_word ON birds(group_word);
CREATE INDEX IF NOT EXISTS idx_birds_genus ON birds(genus);
CREATE INDEX IF NOT EXISTS idx_birds_family ON birds(family);
CREATE INDEX IF NOT EXISTS idx_birds_order ON birds(taxon_order);

-- Selection: playable species of a given breadth, widest first
CREATE INDEX IF NOT EXISTS idx_birds_playable_range
  ON birds(playable, range_size DESC);

-- Per-country species lists, which is how a region's list is drawn
CREATE INDEX IF NOT EXISTS idx_bird_countries_country
  ON bird_countries(country_code);
