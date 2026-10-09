# AviGuessr

A bird is on the page. Point at the country it lives in.

AviGuessr is GeoGuessr for birds: five photographs, five guesses on a world
map, scored by how close you land. It runs on Cloudflare Workers with the
species list, the ranges and the photographs all drawn from open data.

## Playing

**Five rounds**, opening on two birds people know and ending on one they do
not. The ladder is how well observed a species is on iNaturalist — a Eurasian
Magpie has 1.3 million records, a White-throated Greenbul has six — which is
the closest thing the data has to whether a player will recognise the bird.

The species is named while the question is open. Two quetzals are the same
photograph to anyone but a specialist and live a continent apart, so without
the name a player who knew exactly what they were looking at was marked
wrong. Where the name would give the answer away — a Tibetan Bunting lives in
China and nowhere else — the place is inked out.

**Daily challenge** — the same five birds for everyone, with a leaderboard.
One attempt per player per UTC day.

**Scoring** — `5000 × e^(−km / 2000)` for the guess, so a neighbouring country
still scores well and a wrong continent does not, plus up to 1000 for
answering inside the 30-second limit. The speed bonus is scaled by how close
the answer was: clicking instantly on the wrong continent is worth almost
nothing, so thinking is never the expensive option.

**Hints** are opt-in and priced before you commit: continents for 15% of the
round, subregions for 30%. There is deliberately no hint that names a
country, because the country is the answer.

**Scoring feedback** lands as a stamp on the range map, and the round's
winnings count up rather than appearing.

## Running it

```bash
npm install
npm run dev          # Vite on :5173, proxying /api to :8787
npm run dev:worker   # wrangler dev on :8787
npm test
```

The worker needs a D1 database (`aviguessr-db`) and an R2 bucket
(`aviguessr-images`), both named in `wrangler.jsonc`. To build a local
database from scratch:

```bash
./node_modules/.bin/wrangler d1 execute aviguessr-db --local --file=worker/db/schema.sql
for m in worker/db/migration-*.sql; do
  ./node_modules/.bin/wrangler d1 execute aviguessr-db --local --file="$m"
done
npm run build:species-sql && npm run import:species -- --local
```

## Architecture

```
src/          React 19 + React Router, feature-sliced (app/pages/widgets/features/entities/shared)
worker/       Hono on Cloudflare Workers
  routes/     /api/game, /api/birds, /api/daily
  services/   game, daily, birds, hints — all the rules live here
  db/         schema.sql plus numbered migrations
scripts/      the data pipeline (see below)
data/         caches and generated SQL, committed so the pipeline is resumable
```

The server is the authority on score, elapsed time and which hints were taken.
The client sends a country code and nothing else; it cannot claim a time bonus
or hide that it bought a hint.

Photographs are served through `/api/birds/:id/image` out of R2 rather than hot
-linked, so iNaturalist is not serving our traffic.

## The data pipeline

Every step checkpoints to `data/_cache_*.json` and can be re-run after an
interruption; nothing re-fetches what it already has.

| Step | Command | What it does |
|---|---|---|
| 1 | `npm run build:species-sql` | eBird taxonomy + per-country lists → 10,982 guessable species |
| 2 | `npm run import:species` | loads that into D1, in chunks D1 will accept |
| 3 | `npm run collect:curated` | finds each species' iNaturalist taxon page |
| 4 | `npm run collect:photo-candidates` | collects permissively licensed candidate photos |
| 5 | `npm run build:screen-sheets` | lays candidates out on contact sheets, 20 to a sheet, best-known species first |
| 6 | `npm run apply:screen-verdicts` | records which photographs passed the visual screen |
| 7 | `npm run upload:photos` | re-encodes to WebP, uploads to R2, marks species playable |
| 8 | `npm run populate:fun-facts` | first sentence of each Wikipedia summary |
| 9 | `npm run build:observations-sql` + `npm run import:observations` | the observation counts the round ladder is drawn by |

The queue for step 5 is ordered by observations, because the visual pass is
the bottleneck and had been working taxonomically: that is how the game came
to hold a Gray Antwren but no Mallard, House Sparrow or Canada Goose.

Step 5 and 6 exist because the screen has to be a visual one. An audit of the
original Wikimedia Commons images found 62% of them showed no living bird —
distribution maps, hand-coloured plates, museum study skins — and the cheap
sharpness metrics ranked a flock of sparrows and a bird beside a human foot as
the best pictures in a sample. A species with no usable photograph is left out
of rounds rather than shown the wrong picture.

## Data sources

- **Taxonomy and ranges** — [eBird](https://ebird.org) / Cornell Lab of Ornithology
- **Photographs** — [iNaturalist](https://www.inaturalist.org) research-grade
  observations under CC0, CC BY and CC BY-NC. Licence and photographer travel
  with each image and are shown on the round-end page.
- **Facts** — English Wikipedia page summaries (CC BY-SA)
