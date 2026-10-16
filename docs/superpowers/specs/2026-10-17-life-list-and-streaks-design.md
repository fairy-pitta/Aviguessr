# The life list, the bird you keep missing, and the family hint

AviGuessr forgets you the moment a game ends. Five birds, a score, and then
nothing — the next game starts from the same blank page as the first. That is
the whole of what is missing: there is no reason the fortieth game should feel
different from the second.

A birder's answer to this is already a real thing, and it is the obvious one
for this game to borrow. A life list is the record of every species you have
met. It is kept for decades. The bird you have missed and missed again has a
name of its own — a bogey bird — and going back for it is half of why people
keep the list at all.

So: the game remembers the birds it has shown you, scores how you did on each,
and sends the ones you never got right back into the rounds. And because a
list that only counts is just a tally, the hint that costs the most stops
narrowing the map and starts naming the family instead — the thing that would
let you place the next bird in that family without any hint at all.

## What ships

Four pieces, in this order. Each works on its own once the one before it is in.

1. A signed cookie that identifies a player, replacing the localStorage UUID.
2. The life list: a row per species met, written as each guess is scored.
3. The reunion slot: round four is a bird you have missed, when there is one.
4. The family hint, replacing the subregion hint, priced by what it narrows.

Then the daily streak, and the recovery code that moves a list to a new device.

---

## 1. Identity

Today the client makes a UUID, keeps it in localStorage and sends it in
`X-Player-Id`. Anyone can send anyone's id, and clearing site data loses
everything. The second part is what matters here: a list that accumulates for
months cannot live somewhere a browser will quietly empty.

**`players`** holds the identity and everything counted against it:

```sql
CREATE TABLE players (
  id              TEXT PRIMARY KEY,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  recovery_hash   TEXT,          -- sha256 of the recovery code, set on request
  last_daily_date TEXT,          -- UTC date of the last daily completed
  streak_days     INTEGER NOT NULL DEFAULT 0,
  absence_month   TEXT           -- 'YYYY-MM' the one monthly absence was spent
);
```

A Hono middleware on `/api/*` reads `avi_pid`, verifies it, and puts the id on
the context. The cookie is `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age` ten
years, and `Secure` outside local development. Its value is `<uuid>.<hmac>`,
the HMAC being SHA-256 over the uuid keyed by `env.PLAYER_SECRET`. The client
never learns the id and never sends it; this fits the server-is-the-authority
line the scoring already takes.

With no secret configured the middleware falls back to a development key and
warns. Local `wrangler dev` has to work without ceremony, and the cookie
authenticates an anonymous player holding no personal data — the cost of a
weak key in development is that a developer could forge a player id on their
own machine.

**Adopting the old id.** On a request with no cookie, the client sends its
localStorage UUID once in `X-Player-Id`. If no `players` row has that id, the
server adopts it: inserts the row, sets the cookie, and the games and daily
scores already recorded against that id come with it. Any id that has a row
is refused and a fresh one minted. The window where a guessed UUID could be
claimed closes as rows appear, and a v4 UUID is not guessable. The client
clears localStorage once a cookie comes back.

**The recovery code** is minted only when asked for. Twelve characters of
Crockford base32 (no I, L, O or U) shown as `XXXX-XXXX-XXXX`, about 60 bits,
displayed once; the server keeps only `sha256(code)`. Entering it on another
device re-issues that player's cookie there. Minting a new code replaces the
old one. There is no email and no password, so there is nothing to lose but
the code — which is the whole point of printing it once and saying so.

## 2. The life list

```sql
CREATE TABLE life_list (
  player_id    TEXT NOT NULL,
  bird_id      INTEGER NOT NULL REFERENCES birds(id),
  first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at  TEXT NOT NULL DEFAULT (datetime('now')),
  encounters   INTEGER NOT NULL DEFAULT 0,
  correct      INTEGER NOT NULL DEFAULT 0,
  best_score   INTEGER NOT NULL DEFAULT 0,
  last_guess   TEXT,              -- country code, for "you said Brazil last time"
  PRIMARY KEY (player_id, bird_id)
);
```

A species joins the list when it is **shown**, not when it is named. That is
what a life list is: the record of what you met. Whether you placed it is a
column on the row, not a condition for having one.

Which makes the bogey list a query rather than a second table:
`encounters > 0 AND correct = 0`. Nothing to keep in step, nothing to drift.

The upsert joins the batch `submitGuess` already writes, so a guess still
costs one round trip. `submitGuess` reads the owning `games` row anyway, so
the player id is in hand.

`last_guess` exists for one sentence on the result page. It is worth a column:
"you said Brazil last time" is the line that makes a re-encounter land.

**The page** is `/list`, in the book's own language — ruled columns, grouped
by family, no cards. Per row: the species, how many times it has come up, how
many of those were right, the best score. Two filters only: everything, and
the ones never named. Home gains a line: the list's size and how much of it is
still outstanding.

## 3. The reunion slot

`ROUND_FAME` stops being a constant and becomes a plan built per game. **Round
four** is drawn from the player's bogeys; with no bogeys it falls back to the
`known` band it has today.

Round four because the shape of a game is deliberate — two familiar birds to
open, an obscure one to close — and four is the only slot that can be spent
without disturbing either end. A bogey can be of any fame, which skews the
ladder slightly, and that is fine: it is *your* bird, and that is the point.

Among bogeys, the pick is weighted by how many times the bird has been missed,
so a true nemesis comes back sooner than a bird missed once. Weighted, not
sorted: a deterministic pick would show the same bird every game until it was
finally named. The candidate list is fetched (at most twenty, worst first) and
the weighted draw happens in TypeScript, where it can be tested.

The reunion bird is chosen first, then excluded from the other four, so a game
never shows a species twice.

**The round does not announce itself.** Knowing a bird is one you have seen
before narrows it to your own list, which is a substantial hint handed over
for free. The reveal belongs to the result page, where it is the payoff rather
than a clue: *Second encounter — you said Brazil last time.*

**The daily challenge has no reunion slot.** Everyone gets the same five birds;
that promise outranks this feature.

## 4. The family hint

Level two stops saying *Found in: South-Eastern Asia* and starts saying:

> Parrotbills (Paradoxornithidae) — a family of Asia

The subregion hint narrows the map and teaches nothing. The family is the
thing that transfers: a player who learns that tanagers are American places
the next tanager unaided. Level one, the continents, is unchanged — it is the
cheap, purely geographic option, and it should stay available as exactly that.

**It never names a country.** The range half of the sentence is continent
granularity, or subregion when the family sits inside one. The project's
existing rule is that no hint names a country because the country is the
answer, and a family hint for the asities would otherwise read "only in
Madagascar". A player who knows what an asity is still knows; that is
knowledge, and rewarding it is the intent.

**No new data.** The family's range is one query against tables already
present:

```sql
SELECT DISTINCT bc.country_code
  FROM bird_countries bc JOIN birds b ON b.id = bc.bird_id
 WHERE b.family = ?
```

Measured on the full taxonomy — 11,167 species, 118,132 country rows — this
runs in 3 ms, against 173 ms to aggregate every family at once. So it is done
per bird, live, and there is no table to materialise, no pipeline step to add,
and nothing that can go stale as photography fills the playable pool in.

**Pricing follows what the family narrows**, because a fixed price would sell
"Hawks and Eagles — a family of every continent" for the same 30% as the
asities. Over the 251 families the count of countries occupied runs 1 to 252,
median 32, quartiles 7 and 111. Mirroring the shape of `rangeWeight`:

```
familyHintCost(n) = 0.12 + 0.30 / (1 + n / 48)
```

A one-country family costs 41%, the median family 30% — what the subregion
hint cost, so a typical round is priced as it was — and the most cosmopolitan
family 17%. Taken with level one the worst case is 56%, which leaves a round
worth playing for, as the existing test requires.

The price is therefore per-round, so it goes in the round payload and the hint
strip renders the number the server sent rather than a client constant. A bird
with no family recorded falls back to the subregion hint at its old flat 30%.

## 5. The streak

On a completed daily, against `players`:

- last daily is today — nothing changes, so a repeat submission is harmless
- last daily was yesterday — the streak advances
- exactly one day was missed and this month's absence is unspent — the streak
  advances and the absence is spent
- anything else — the streak restarts at one

One forgiven day a month, because the list is a long-term object and a single
busy day should not be the thing that ends a hundred-day run. The whole rule
is a pure function of (streak, last date, today, absence month), which is how
it will be tested.

## Testing

Pure functions carry the rules, as they already do in this codebase, and are
tested directly under the existing naming convention
`test_<action>_<condition>_<expected_result>`:

- `advanceStreak` — each branch above, including the idempotent repeat
- `familyHintCost` — the anchor at the median, monotonic fall, both bounds
- `formatFamilyHint` — never emits a country name; subregion when inside one
- `pickReunionBird` — weighting, the empty case, exclusion of duplicates
- `lifeListUpsert` — first encounter, repeat, best score not regressing
- cookie signing and verification, and refusal of a tampered value, beside the
  other authority tests

## Migrations

- `migration-007-players-and-life-list.sql` — both tables and their indexes
- no migration for the family hint; it reads what is already there

---

## What this deliberately leaves out

Named leaderboards, friend challenges and shared result images all want the
identity this adds, and all of them can be built on it afterwards. Alternate
modes — region-limited, family-guessing, sudden death, birdsong — are a
different axis entirely and none of them is blocked by this work. Adaptive
difficulty needs the per-player history this creates, and is better designed
once there is some.
