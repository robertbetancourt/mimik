import type { Player } from "@/types/player";

export interface RankedPlayer {
  player: Player;
  rank: number;
  score: number;
}

// Standard competition ranking (1-2-2-4): tied players share a position and
// the position immediately after a tie is skipped accordingly.
//
// `orderByTeam` groups players by team score first (both teammates always
// outrank both members of a lower-scoring team), falling back to individual
// score to order within a team. Rank itself becomes the team's standing —
// teammates share a rank, like Olympic team results — while `score` stays
// each player's own points, so a team-mode leaderboard row still reads
// "this is MY score" even though position reflects the team outcome. This
// is what keeps the podium (built from the first 3 ranked entries) honest:
// it can never show a player from the losing team standing above the team
// that the app just declared the winner.
export function rankPlayers(
  players: Player[],
  scores: Record<string, number>,
  orderByTeam = false,
): RankedPlayer[] {
  const scoreOf = (player: Player) => scores[player.id] ?? 0;
  const teamScoreOf = (player: Player) =>
    players.filter((other) => other.teamId === player.teamId).reduce((sum, p) => sum + scoreOf(p), 0);

  const sorted = [...players].sort((a, b) => {
    if (orderByTeam) {
      const teamDiff = teamScoreOf(b) - teamScoreOf(a);
      if (teamDiff !== 0) return teamDiff;
    }
    return scoreOf(b) - scoreOf(a);
  });

  return sorted.map((player) => {
    const compareValue = orderByTeam ? teamScoreOf(player) : scoreOf(player);
    const rank =
      1 +
      sorted.filter((other) => {
        const otherValue = orderByTeam ? teamScoreOf(other) : scoreOf(other);
        return otherValue > compareValue;
      }).length;
    return { player, rank, score: scoreOf(player) };
  });
}
