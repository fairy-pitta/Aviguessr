-- How well known a bird is, which the game had no notion of.
--
-- Difficulty was range breadth alone, so a round could open with a Collared
-- Puffbird or a Gray Antwren — birds almost nobody has seen — while the
-- Resplendent Quetzal sat unplayable for want of a screened photograph. The
-- count of research-grade iNaturalist observations is the closest thing the
-- data has to "would a player recognise this": a Eurasian Magpie has 1.3
-- million, a White-throated Greenbul has six.
--
-- Zero means either genuinely unobserved or a request that never got an
-- answer, and both belong at the obscure end, so the default is safe.

ALTER TABLE birds ADD COLUMN observations INTEGER NOT NULL DEFAULT 0;

-- Selection draws one random playable species from a band of this column
CREATE INDEX IF NOT EXISTS idx_birds_playable_observations
  ON birds(playable, observations);
