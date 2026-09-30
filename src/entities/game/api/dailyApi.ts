import { apiFetch } from "@/shared/api/client";

type DailyChallengeResponse = {
  date: string;
  gameId: string;
  rounds: {
    round: number;
    bird: {
      id: number;
      name: string;
      family: string | null;
      difficulty: string;
      imageUrl: string;
    };
  }[];
};

type DailyStatusResponse = {
  date: string;
  completed: boolean;
  totalScore: number | null;
  roundsJson: string | null;
};

type DailyLeaderboardEntry = {
  playerId: string;
  totalScore: number;
  completedAt: string;
};

type DailyLeaderboardResponse = {
  date: string;
  leaderboard: DailyLeaderboardEntry[];
};

export function getDailyChallenge(
  playerId: string
): Promise<DailyChallengeResponse> {
  return apiFetch<DailyChallengeResponse>("/daily", {
    headers: { "X-Player-Id": playerId },
  });
}

export function getDailyStatus(
  playerId: string
): Promise<DailyStatusResponse> {
  return apiFetch<DailyStatusResponse>("/daily/status", {
    headers: { "X-Player-Id": playerId },
  });
}

export function getDailyLeaderboard(): Promise<DailyLeaderboardResponse> {
  return apiFetch<DailyLeaderboardResponse>("/daily/leaderboard");
}

export function submitDailyScore(
  playerId: string
): Promise<{ success: boolean; totalScore: number }> {
  // The score and round list come from the server's own record of the game.
  return apiFetch<{ success: boolean; totalScore: number }>("/daily/score", {
    method: "POST",
    headers: { "X-Player-Id": playerId },
  });
}
