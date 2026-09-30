import { useNavigate } from "react-router-dom";
import { useStartGame } from "@/features/start-game";
import { Button } from "@/shared/ui";

/**
 * The title page of the guide. It opens on the premise rather than on a
 * feature list: a plate, and the question the plate is asking.
 */
export function HomePage() {
  const navigate = useNavigate();
  const { start, loading } = useStartGame();

  const begin = async (mode: "classic" | "multiple_choice") => {
    const result = await start(mode);
    if (result) {
      navigate(`/game/${result.gameId}`, {
        state: { rounds: result.rounds, mode: result.mode },
      });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl">
        <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-none">
          AviGuessr
        </h1>
        <p className="mt-5 text-xl leading-relaxed text-[var(--color-ink-soft)] max-w-[34ch]">
          A field guide gives you the plate and the range map together. Here you
          get the plate, and you draw the range.
        </p>

        <div className="mt-10 border-t rule">
          <button
            type="button"
            disabled={loading}
            onClick={() => begin("classic")}
            className="w-full text-left py-5 border-b rule group disabled:opacity-50"
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

          <button
            type="button"
            disabled={loading}
            onClick={() => begin("multiple_choice")}
            className="w-full text-left py-5 border-b rule disabled:opacity-50"
          >
            <span className="flex items-baseline justify-between gap-4">
              <span className="text-2xl font-medium">Four choices</span>
              <span className="text-base text-[var(--color-ink-soft)] shrink-0">
                quicker
              </span>
            </span>
            <span className="mt-1 block text-base text-[var(--color-ink-soft)]">
              One country out of four. No partial credit.
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/daily")}
            className="w-full text-left py-5 border-b rule"
          >
            <span className="flex items-baseline justify-between gap-4">
              <span className="text-2xl font-medium">Today's five</span>
              <span className="text-base text-[var(--color-ink-soft)] shrink-0">
                once a day
              </span>
            </span>
            <span className="mt-1 block text-base text-[var(--color-ink-soft)]">
              The same five birds for everyone, with a leaderboard.
            </span>
          </button>
        </div>

        <p className="mt-8 text-base text-[var(--color-ink-faint)]">
          782 species, photographed in the wild, from 172 countries.
        </p>

        {loading && (
          <p className="mt-4 text-base text-[var(--color-ink-soft)]">
            Choosing your plates
          </p>
        )}
      </div>
    </div>
  );
}
