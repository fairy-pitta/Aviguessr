import { apiFetch } from "@/shared/api/client";

type DailyChallengeResponse = {
  /** A perfect game of the day's five birds, which varies with their ranges. */
  maxScore: number;
  date: string;
  gameId: string;
  rounds: {
    round: number;
    bird: {
      id: number;
      name: string;
      difficulty: string;
      imageUrl: string;
    };
    hintCosts: number[];
  }[];
};

type DailyStatusResponse = {
  maxScore: number | null;
  date: string;
  completed: boolean;
  totalScore: number | null;
  roundsJson: string | null;
  streakDays: number;
};

type DailyLeaderboardEntry = {
  /** Marked by the server, which is the only side that knows who you are. */
  isYou: boolean;
  totalScore: number;
  completedAt: string;
};

type DailyLeaderboardResponse = {
  date: string;
  leaderboard: DailyLeaderboardEntry[];
};

export function getDailyChallenge(): Promise<DailyChallengeResponse> {
  return apiFetch<DailyChallengeResponse>("/daily");
}

export function getDailyStatus(): Promise<DailyStatusResponse> {
  return apiFetch<DailyStatusResponse>("/daily/status");
}

export function getDailyLeaderboard(): Promise<DailyLeaderboardResponse> {
  return apiFetch<DailyLeaderboardResponse>("/daily/leaderboard");
}

export function submitDailyScore(): Promise<{
  success: boolean;
  totalScore: number;
  streakDays: number;
}> {
  // The score and round list come from the server's own record of the game.
  return apiFetch("/daily/score", { method: "POST" });
}
