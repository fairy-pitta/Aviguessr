-- Migration 007: A player the game remembers, and the list it remembers for them
--
-- A game used to end and take everything with it. The only thing attached to
-- a player was one day's leaderboard row, and the player was a UUID the
-- client kept in localStorage and sent in a header — anyone could send
-- anyone's, and clearing site data lost it.
--
-- Neither mattered for a single day's score. A life list accumulates for
-- months, so it needs an identity that survives and a place to accumulate in.

CREATE TABLE IF NOT EXISTS players (
  id              TEXT PRIMARY KEY,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  -- sha256 of the recovery code. Null until the player asks for one; the
  -- code itself is shown once and never stored.
  recovery_hash   TEXT,
  -- The UTC date of the last daily challenge completed, which is what the
  -- streak is measured from
  last_daily_date TEXT,
  streak_days     INTEGER NOT NULL DEFAULT 0,
  -- 'YYYY-MM' of the month whose single forgiven absence has been spent
  absence_month   TEXT
);

-- Carrying a list to another device is a lookup by code, not by player
CREATE INDEX IF NOT EXISTS idx_players_recovery
  ON players(recovery_hash);

-- A species joins the list when it is SHOWN, not when it is named: that is
-- what a life list is. Whether the player placed it is a column here, not a
-- condition for having a row — which makes the bogey list a query
-- (encounters > 0 AND correct = 0) rather than a second table to keep in step.
CREATE TABLE IF NOT EXISTS life_list (
  player_id     TEXT NOT NULL,
  bird_id       INTEGER NOT NULL REFERENCES birds(id),
  first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at  TEXT NOT NULL DEFAULT (datetime('now')),
  encounters    INTEGER NOT NULL DEFAULT 0,
  correct       INTEGER NOT NULL DEFAULT 0,
  best_score    INTEGER NOT NULL DEFAULT 0,
  -- The country guessed last time, for the one line that makes a re-encounter
  -- land: "you said Brazil last time"
  last_guess    TEXT,
  PRIMARY KEY (player_id, bird_id)
);

-- Drawing round four: this player's birds that have never been named
CREATE INDEX IF NOT EXISTS idx_life_list_bogey
  ON life_list(player_id, correct, encounters);
