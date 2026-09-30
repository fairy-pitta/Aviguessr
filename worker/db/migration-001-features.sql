-- Migration 001: Add columns for hint system, habitat, learning, modes, daily

-- Bird enrichment (Features 2, 4)
ALTER TABLE birds ADD COLUMN habitat TEXT;
ALTER TABLE birds ADD COLUMN biome TEXT;
ALTER TABLE birds ADD COLUMN fun_fact TEXT;
ALTER TABLE birds ADD COLUMN range_description TEXT;

-- Game modes (Features 3, 5)
ALTER TABLE games ADD COLUMN mode TEXT DEFAULT 'classic';

-- Hint tracking (Feature 1)
ALTER TABLE game_rounds ADD COLUMN hints_used INTEGER DEFAULT 0;

-- Multiple choice options (Feature 3)
ALTER TABLE game_rounds ADD COLUMN choices TEXT;

-- Daily challenge (Feature 5)
CREATE TABLE IF NOT EXISTS daily_challenges (
  date TEXT PRIMARY KEY,
  bird_ids TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_scores (
  date TEXT NOT NULL,
  player_id TEXT NOT NULL,
  total_score INTEGER NOT NULL,
  rounds_json TEXT NOT NULL,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (date, player_id)
);

-- Leaderboard lookup: one query per date ordered by score
CREATE INDEX IF NOT EXISTS idx_daily_scores_date_score
  ON daily_scores(date, total_score DESC);
