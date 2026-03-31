import { useNavigate } from "react-router-dom";
import { StartButton, useStartGame } from "@/features/start-game";

export function HomePage() {
  const navigate = useNavigate();
  const { start, loading } = useStartGame();

  const handleStart = async () => {
    const result = await start();
    if (result) {
      navigate(`/game/${result.gameId}`, {
        state: { rounds: result.rounds },
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white">
      <h1 className="text-6xl font-bold text-emerald-800 mb-4">AviGuessr</h1>
      <p className="text-xl text-gray-600 mb-8">
        Guess where the bird lives!
      </p>
      <StartButton loading={loading} onStart={handleStart} />
    </div>
  );
}
