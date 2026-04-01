import type { Bird } from "../model/types";

type BirdCardProps = {
  bird: Bird;
};

const difficultyColors: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-800",
  medium: "bg-yellow-100 text-yellow-800",
  hard: "bg-red-100 text-red-800",
};

const biomeColors: Record<string, string> = {
  tropical: "bg-green-500",
  temperate: "bg-teal-500",
  boreal: "bg-blue-500",
  arctic: "bg-cyan-400",
  desert: "bg-amber-500",
  grassland: "bg-lime-500",
  wetland: "bg-sky-500",
  marine: "bg-indigo-500",
  mountain: "bg-slate-500",
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
        {bird.habitat && (
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <span aria-hidden="true">&#x1f33f;</span>
            {bird.habitat}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${difficultyColors[bird.difficulty] ?? ""}`}
          >
            {bird.difficulty}
          </span>
          {bird.biome && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-white bg-opacity-90"
              style={{ backgroundColor: undefined }}
            >
              <span
                className={`inline-block w-2 h-2 rounded-full ${biomeColors[bird.biome.toLowerCase()] ?? "bg-gray-400"}`}
              />
              <span className="text-gray-600">{bird.biome}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
