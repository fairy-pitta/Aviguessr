import { useNavigate } from "react-router-dom";
import { useStartGame } from "@/features/start-game";
import { Button } from "@/shared/ui";

export function HomePage() {
  const navigate = useNavigate();
  const { start, loading } = useStartGame();

  const handleClassic = async () => {
    const result = await start("classic");
    if (result) {
      navigate(`/game/${result.gameId}`, {
        state: { rounds: result.rounds, mode: result.mode },
      });
    }
  };

  const handleQuickPlay = async () => {
    const result = await start("multiple_choice");
    if (result) {
      navigate(`/game/${result.gameId}`, {
        state: { rounds: result.rounds, mode: result.mode },
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[var(--color-surface)]" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-teal-500/5 blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal-500/3 blur-[100px]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center stagger">
        {/* Logo */}
        <div className="animate-fade-up mb-2">
          <span className="text-sm font-mono font-medium tracking-[0.3em] text-teal-400/60 uppercase">
            Bird Geography Game
          </span>
        </div>

        <h1 className="animate-fade-up text-7xl font-black tracking-tight text-gradient-accent mb-3">
          AviGuessr
        </h1>

        <p className="animate-fade-up text-lg text-[var(--color-text-body)] mb-12 max-w-md text-center">
          Can you guess where each bird calls home? Test your knowledge across 939 species from every continent.
        </p>

        {/* Game mode buttons */}
        <div className="animate-fade-up flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Button
            onClick={handleClassic}
            disabled={loading}
            className="flex-1"
            size="lg"
          >
            {loading ? "Loading..." : "Classic Mode"}
          </Button>
          <Button
            variant="secondary"
            onClick={handleQuickPlay}
            disabled={loading}
            className="flex-1"
            size="lg"
          >
            Quick Play
          </Button>
        </div>

        {/* Daily challenge */}
        <div className="animate-fade-up mt-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/daily")}
            size="sm"
          >
            Daily Challenge →
          </Button>
        </div>

        {/* Stats footer */}
        <div className="animate-fade-up mt-16 flex items-center gap-8 text-sm text-[var(--color-text-muted)]">
          <div className="text-center">
            <div className="font-mono font-bold text-slate-400 text-base">939</div>
            <div>Species</div>
          </div>
          <div className="w-px h-8 bg-white/5" />
          <div className="text-center">
            <div className="font-mono font-bold text-slate-400 text-base">172</div>
            <div>Countries</div>
          </div>
          <div className="w-px h-8 bg-white/5" />
          <div className="text-center">
            <div className="font-mono font-bold text-slate-400 text-base">5</div>
            <div>Rounds</div>
          </div>
        </div>
      </div>
    </div>
  );
}
