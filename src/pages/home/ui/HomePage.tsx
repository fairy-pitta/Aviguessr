import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStartGame } from "@/features/start-game";
import { FieldKit, HandRule, BookPage } from "@/shared/ui";
import { getPlayer } from "@/entities/player";
import type { PlayerResponse } from "@/entities/player";

/**
 * The title page of the guide — the one screen in the book that is centred.
 * It opens on the drawing rather than on a feature list, because the drawing
 * says the premise faster than the sentence does: here is the spread a guide
 * gives you, and here is the half of it you have to fill in.
 */
export function HomePage() {
  const navigate = useNavigate();
  const { start, loading } = useStartGame();
  // What the player has standing: the list is the reason to come back, so
  // the title page says how big it is rather than hiding it behind a click
  const [player, setPlayer] = useState<PlayerResponse | null>(null);

  useEffect(() => {
    getPlayer()
      .then(setPlayer)
      .catch(() => {
        // A first visit, or an unreachable server: the page stands alone
      });
  }, []);

  const begin = async () => {
    const result = await start();
    if (result) {
      navigate(`/game/${result.gameId}`, {
        state: { rounds: result.rounds, maxScore: result.maxScore },
      });
    }
  };

  return (
    <BookPage>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <FieldKit className="mx-auto w-[288px] sm:w-[368px] h-auto" />

          <div className="mt-6 text-center">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-none">
              AviGuessr
            </h1>
            <p className="mt-4 mx-auto text-lg leading-relaxed text-[var(--color-ink-soft)] max-w-[32ch]">
              A guide hands you the plate and the range map together. Here you
              get the plate, and you draw the range.
            </p>
          </div>

          <div className="mt-8">
            <HandRule />
            <button
              type="button"
              disabled={loading}
              onClick={begin}
              className="w-full text-left py-4 disabled:opacity-50"
            >
              <span className="flex items-baseline justify-between gap-4">
                <span className="text-2xl font-medium">Name the country</span>
                <span className="text-base text-[var(--color-ink-soft)] shrink-0">
                  five plates
                </span>
              </span>
              <span className="mt-1 block text-base text-[var(--color-ink-soft)]">
                Pick the country on the map. Closer guesses still score.
              </span>
            </button>
            <HandRule />

            <button
              type="button"
              onClick={() => navigate("/daily")}
              className="w-full text-left py-4"
            >
              <span className="flex items-baseline justify-between gap-4">
                <span className="text-2xl font-medium">Today's five</span>
                <span className="text-base text-[var(--color-ink-soft)] shrink-0">
                  {player && player.streakDays > 0
                    ? `${player.streakDays} days running`
                    : "once a day"}
                </span>
              </span>
              <span className="mt-1 block text-base text-[var(--color-ink-soft)]">
                The same five birds for everyone, with a leaderboard.
              </span>
            </button>
            <HandRule />

            <button
              type="button"
              onClick={() => navigate("/list")}
              className="w-full text-left py-4"
            >
              <span className="flex items-baseline justify-between gap-4">
                <span className="text-2xl font-medium">Your life list</span>
                <span className="text-base text-[var(--color-ink-soft)] shrink-0 tabular">
                  {player ? `${player.lifeList.species} species` : "\u00A0"}
                </span>
              </span>
              <span className="mt-1 block text-base text-[var(--color-ink-soft)]">
                {player && player.lifeList.bogeys > 0
                  ? `Every bird you have met. ${player.lifeList.bogeys} still unnamed.`
                  : "Every bird you have met, and how you did on it."}
              </span>
            </button>
            <HandRule />
          </div>

          <p className="mt-6 text-center text-base text-[var(--color-ink-faint)]">
            {loading
              ? "Choosing your plates"
              : "782 species, photographed in the wild, from 172 countries."}
          </p>
        </div>
      </div>
    </BookPage>
  );
}
