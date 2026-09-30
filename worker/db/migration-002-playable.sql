-- Migration 002: Only serve birds that have a verified photograph
--
-- A visual audit of the original Commons-sourced images found 62% of them
-- showed no living bird (distribution maps, hand-coloured plates, museum study
-- skins, book scans). Images were re-sourced from iNaturalist research-grade
-- observations; species with no permissively licensed photo are excluded from
-- rounds instead of being shown a wrong picture.

ALTER TABLE birds ADD COLUMN playable INTEGER NOT NULL DEFAULT 1;

-- Random pick per difficulty is the hot path for every round
CREATE INDEX IF NOT EXISTS idx_birds_playable_difficulty
  ON birds(playable, difficulty);
