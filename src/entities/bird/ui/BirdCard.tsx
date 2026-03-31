import type { Bird } from "../model/types";

type BirdCardProps = {
  bird: Bird;
};

const difficultyColors: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-800",
  medium: "bg-yellow-100 text-yellow-800",
  hard: "bg-red-100 text-red-800",
};

export function BirdCard({ bird }: BirdCardProps) {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden w-72 border border-gray-200">
      <img
        src={bird.imageUrl}
        alt={bird.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-3">
        <h3 className="font-semibold text-gray-900">{bird.name}</h3>
        {bird.family && (
          <p className="text-sm text-gray-500">{bird.family}</p>
        )}
        <span
          className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${difficultyColors[bird.difficulty] ?? ""}`}
        >
          {bird.difficulty}
        </span>
      </div>
    </div>
  );
}
