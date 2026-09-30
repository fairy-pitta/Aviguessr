import type { Bird } from "../model/types";

type BirdCardProps = {
  bird: Bird;
  /**
   * Whether the round is over. Common names frequently name the place the bird
   * lives ("Tibetan Partridge", "Peruvian Racket-tail"), so the name and family
   * are withheld until the guess is in.
   */
  revealed?: boolean;
};

const difficultyConfig: Record<string, { label: string; color: string }> = {
  easy: {
    label: "EASY",
    color: "bg-teal-500/25 text-teal-200 border-teal-400/50",
  },
  medium: {
    label: "MED",
    color: "bg-amber-500/25 text-amber-100 border-amber-400/50",
  },
  hard: {
    label: "HARD",
    color: "bg-rose-500/25 text-rose-100 border-rose-400/50",
  },
};

export function BirdCard({ bird, revealed = false }: BirdCardProps) {
  const diff = difficultyConfig[bird.difficulty] ?? difficultyConfig.medium;

  return (
    <div className="glass rounded-xl overflow-hidden w-72 animate-slide-in-right glow-accent">
      <div className="relative">
        <img
          src={bird.imageUrl}
          alt={revealed ? bird.name : "Bird to identify"}
          className="w-full h-48 object-cover"
        />

        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-1 rounded-md text-xs font-bold tracking-widest border ${diff.color}`}
          >
            {diff.label}
          </span>
        </div>
      </div>

      <div className="p-3">
        {revealed ? (
          <>
            <h3 className="font-bold text-[var(--color-text-strong)] text-lg leading-tight">
              {bird.name}
            </h3>
            {bird.family && (
              <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                {bird.family}
              </p>
            )}
          </>
        ) : (
          <p className="text-base font-semibold text-[var(--color-text-body)] leading-tight">
            Where does this bird live?
          </p>
        )}

        {bird.habitat && (
          <p className="text-sm text-teal-200 mt-2 flex items-center gap-1.5">
            <span aria-hidden="true">🌿</span>
            {bird.habitat}
          </p>
        )}
      </div>
    </div>
  );
}
