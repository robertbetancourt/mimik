import type { Player } from "@/types/player";

export interface RankedPlayer {
  player: Player;
  rank: number;
  score: number;
}

// Standard competition ranking (1-2-2-4): tied players share a position and
// the position immediately after a tie is skipped accordingly.
export function rankPlayers(players: Player[], scores: Record<string, number>): RankedPlayer[] {
  const sorted = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));

  return sorted.map((player) => {
    const score = scores[player.id] ?? 0;
    const rank = 1 + sorted.filter((other) => (scores[other.id] ?? 0) > score).length;
    return { player, rank, score };
  });
}
