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
One attempt per player per UTC day, and a count of the days in a row. One
missed day a month is forgiven: a list that takes months to build should not
end on a single busy Tuesday.

**The life list** is what the game remembers. A species joins it when it is
shown, not when it is named — that is what a life list is — and each row
records how often the bird has come up, how often it was placed, and the best
the player has done on it. So the birds never placed are a query rather than
a second list, and one of the middle rounds of a new game is drawn from
them: a bird you have missed comes back, weighted so the one you have missed
most comes back soonest. Which of the two it is varies from game to game,
and you are not told during the round. Knowing a bird is one you have seen
narrows it to your own list, which is a substantial hint for nothing — and a
fixed round would have given it away by its position before the photograph
had been looked at. It is said afterwards, where it is the payoff.

The daily challenge has no reunion round. Everyone gets the same five birds.

**Scoring** — `5000 × e^(−km / 2000)` for the guess, so a neighbouring country
still scores well and a wrong continent does not, plus up to 1000 for
answering inside the 30-second limit. The speed bonus is scaled by how close
the answer was: clicking instantly on the wrong continent is worth almost
nothing, so thinking is never the expensive option.

A round is then worth more or less by how narrow the bird's range is. Being
right about a bird recorded in 150 countries says almost nothing — there are
150 right answers out of 185 — while a bird found in one country has exactly
one. The weight runs from about ×1.23 for an endemic down towards ×0.70 for
a cosmopolitan bird, anchored so that the median range of four countries is
worth what it always was. It is a smooth curve, so no single country added to
a range ever costs a step.

That makes a perfect game worth a different amount every time, so the tally
measures against this game's own maximum rather than a constant.

**Answering** is by typing the country's name or by pointing at it on the
map. The map alone meant zooming to the country first, which is hopeless at
speed for Luxembourg or Singapore; the map is still the range map you are
filling in, it just is not the only way in.

**Hints** are opt-in and priced before you commit. The first names the
continents, for 15% of the round. The second names the family:

> Parrotbills (Paradoxornithidae) — a family of Eastern Asia

It replaced a hint that named the subregion, which narrows the map and
teaches nothing. The family is the part that transfers — learn that tanagers
are American and you place the next tanager unaided — and its price moves
with how much it narrows: across the 251 families the count of countries
occupied runs 1 to 252, median 32, so a one-country family costs 41%, the
median 30% (what the old hint cost flat) and the most cosmopolitan 17%.

Neither hint ever names a country, because the country is the answer. The
family hint describes a range at continent granularity, or subregion when the
family sits inside one — and two of the subregions are country lists in
disguise, so "Australia and New Zealand" comes out as Oceania. A player who
knows what an asity is still knows it means Madagascar; that is knowledge,
and rewarding it is the point.

Because the family is now the answer to a hint, it does not travel with the
question. It reaches the client with the result.

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
(`aviguessr-images`), both named in `wrangler.jsonc`, and a secret to sign
player cookies with:

```bash
wrangler secret put PLAYER_SECRET   # any long random string
```

A request to localhost falls back to a development key and warns, so `npm
run dev:worker` needs nothing set. A deployed request with no secret fails
instead: the fallback key is in this repository, and signing real cookies
with it would let anyone forge one for any player and open their life list.

To build a local database from scratch:

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
  middleware/ the signed player cookie, on the routes that need a player
  routes/     /api/game, /api/birds, /api/daily, /api/player, /api/life-list
  services/   game, daily, birds, hints, life-list, player, streak — the rules
  db/         schema.sql plus numbered migrations
scripts/      the data pipeline (see below)
data/         caches and generated SQL, committed so the pipeline is resumable
```

The server is the authority on score, elapsed time and which hints were taken.
The client sends a country code and nothing else; it cannot claim a time bonus
or hide that it bought a hint.

It no longer sends who it is either. The player used to be a UUID the client
kept in localStorage and put in a header, so one player could send another's
id and clearing site data lost the account. Neither mattered for a single
day's leaderboard row; a life list accumulates for months. The id now lives in
an HttpOnly cookie signed with `PLAYER_SECRET`, which the client never reads.

Those old ids are not carried over. It would have been one header on one
request, but the leaderboard used to return every player's id to every
client — they were published rather than secret, and honouring one would
hand anybody holding a copy of a leaderboard the player it belongs to.
Nothing visible is lost: the life list is new and starts empty for everyone,
and no screen shows a player their past days.

There is no login. A recovery code — twelve characters of Crockford base32,
shown once, stored only as a hash — carries a list to another device.

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

Step 6 is also the one step worth running in parallel. `sheetRanges` splits
the sheets into one contiguous span per worker; each worker judges its own
sheets and writes its own `NNNN.verdict.json`, and nothing is shared until
`apply:screen-verdicts` merges them. The merge itself cannot be fanned out —
every worker would be rewriting the same cache and the last one would win.

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
