CREATE TABLE IF NOT EXISTS birds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  species_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  family TEXT,
  difficulty TEXT NOT NULL CHECK(difficulty IN ('easy','medium','hard')),
  image_key TEXT NOT NULL,
  image_license TEXT,
  image_artist TEXT
);

CREATE TABLE IF NOT EXISTS bird_countries (
  bird_id INTEGER NOT NULL REFERENCES birds(id),
  country_code TEXT NOT NULL,
  PRIMARY KEY (bird_id, country_code)
);

CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  total_score INTEGER DEFAULT 0,
  current_round INTEGER DEFAULT 1,
  status TEXT DEFAULT 'playing' CHECK(status IN ('playing','finished'))
);

CREATE TABLE IF NOT EXISTS game_rounds (
  game_id TEXT NOT NULL REFERENCES games(id),
  round INTEGER NOT NULL,
  bird_id INTEGER NOT NULL REFERENCES birds(id),
  difficulty TEXT NOT NULL,
  guessed_country TEXT,
  is_correct INTEGER,
  distance_km REAL,
  score INTEGER,
  time_ms INTEGER,
  PRIMARY KEY (game_id, round)
);
