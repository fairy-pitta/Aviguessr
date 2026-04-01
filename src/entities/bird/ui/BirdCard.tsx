import type { Bird } from "../model/types";

type BirdCardProps = {
  bird: Bird;
};

const difficultyConfig: Record<string, { label: string; color: string }> = {
  easy: { label: "EASY", color: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
  medium: { label: "MED", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  hard: { label: "HARD", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
};

export function BirdCard({ bird }: BirdCardProps) {
  const diff = difficultyConfig[bird.difficulty] ?? difficultyConfig.medium;

  return (
    <div className="glass rounded-xl overflow-hidden w-72 animate-slide-in-right glow-accent">
      {/* Image with gradient overlay */}
      <div className="relative">
        <img
          src={bird.imageUrl}
          alt={bird.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent" />

        {/* Difficulty badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-widest border ${diff.color}`}
          >
            {diff.label}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 -mt-4 relative">
        <h3 className="font-bold text-white text-base leading-tight">
          {bird.name}
        </h3>
        {bird.family && (
          <p className="text-xs text-slate-400 mt-0.5">{bird.family}</p>
        )}
        {bird.habitat && (
          <p className="text-[11px] text-teal-400/70 mt-1 flex items-center gap-1">
            <span>🌿</span>
            {bird.habitat}
          </p>
        )}
      </div>
    </div>
  );
}
