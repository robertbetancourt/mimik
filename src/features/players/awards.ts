import type { PlayerStat } from "@/features/match/store";
import i18n from "@/i18n";
import type { Player } from "@/types/player";

export interface Award {
  id: string;
  badge: string;
  title: string;
  description: string;
  player: Player;
  statValue: string;
}

// Post-match highlights beyond the ranking — surfaces standout performances
// that a plain score list hides (a player who barely won on points but
// passed on everything, for instance). Skips any award with no meaningful
// signal (nobody got anything right, nobody passed) rather than forcing all
// three onto the screen every time.
export function calculateAwards(
  players: Player[],
  playerStats: Record<string, PlayerStat>,
  playerScores: Record<string, number>,
): Award[] {
  if (players.length === 0) return [];

  const awards: Award[] = [];

  let maxCorrectPlayer: Player | null = null;
  let maxCorrect = 0;

  let maxPassedPlayer: Player | null = null;
  let maxPassed = 0;

  let bestAccuracyPlayer: Player | null = null;
  let bestAccuracy = -1;

  for (const player of players) {
    const stat = playerStats[player.id] ?? {
      correct: playerScores[player.id] ?? 0,
      passed: 0,
      totalWords: playerScores[player.id] ?? 0,
    };

    if (stat.correct > maxCorrect) {
      maxCorrect = stat.correct;
      maxCorrectPlayer = player;
    }

    if (stat.passed > maxPassed) {
      maxPassed = stat.passed;
      maxPassedPlayer = player;
    }

    if (stat.totalWords >= 2) {
      const accuracy = (stat.correct / stat.totalWords) * 100;
      if (accuracy > bestAccuracy) {
        bestAccuracy = accuracy;
        bestAccuracyPlayer = player;
      }
    }
  }

  if (maxCorrectPlayer && maxCorrect > 0) {
    awards.push({
      id: "speedster",
      badge: "⚡",
      title: i18n.t("awards.speedsterTitle"),
      description: i18n.t("awards.speedsterDesc"),
      player: maxCorrectPlayer,
      statValue: i18n.t("awards.speedsterValue", { n: maxCorrect }),
    });
  }

  if (maxPassedPlayer && maxPassed > 0 && maxPassedPlayer.id !== maxCorrectPlayer?.id) {
    awards.push({
      id: "thinker",
      badge: "🦥",
      title: i18n.t("awards.thinkerTitle"),
      description: i18n.t("awards.thinkerDesc"),
      player: maxPassedPlayer,
      statValue: i18n.t("awards.thinkerValue", { n: maxPassed }),
    });
  }

  if (
    bestAccuracyPlayer &&
    bestAccuracy > 0 &&
    bestAccuracyPlayer.id !== maxCorrectPlayer?.id &&
    bestAccuracyPlayer.id !== maxPassedPlayer?.id
  ) {
    awards.push({
      id: "accuracy",
      badge: "🎯",
      title: i18n.t("awards.accuracyTitle"),
      description: i18n.t("awards.accuracyDesc"),
      player: bestAccuracyPlayer,
      statValue: i18n.t("awards.accuracyValue", { n: Math.round(bestAccuracy) }),
    });
  }

  return awards;
}
