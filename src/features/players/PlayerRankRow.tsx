import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { withAlpha } from "@/components/stage/StageGlow";
import { getCharacterById } from "@/features/players/characters";
import type { Player } from "@/types/player";

interface PlayerRankRowProps {
  rank: number;
  player: Player;
  score: number;
  /** Highest score on the board — sizes this row's bar. */
  maxScore: number;
  /** Highlights the player who just played. */
  highlight?: boolean;
  accent: string;
  /** Stagger index for the bar fill. */
  index?: number;
}

const MEDALS: Record<number, string> = { 1: "#FFD54A", 2: "#D9E1EC", 3: "#F4A26B" };

// Leaderboard row on the dark stage: glass row, a score bar that fills in
// proportion to the leader, and the player who just played lit with the
// category accent.
export function PlayerRankRow({ rank, player, score, maxScore, highlight, accent, index = 0 }: PlayerRankRowProps) {
  const character = getCharacterById(player.characterId);
  const fill = useSharedValue(0);
  const target = maxScore > 0 ? score / maxScore : 0;

  useEffect(() => {
    fill.value = withDelay(350 + index * 90, withTiming(target, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [target, index, fill]);

  const barStyle = useAnimatedStyle(() => ({ width: `${Math.max(fill.value, 0.02) * 100}%` }));
  const medal = MEDALS[rank];

  return (
    <Animated.View
      layout={LinearTransition.duration(280)}
      style={[
        styles.row,
        highlight && { borderColor: withAlpha(accent, 0.7), backgroundColor: withAlpha(accent, 0.12) },
      ]}
    >
      <View style={[styles.rank, medal ? { backgroundColor: medal } : null]}>
        <Text style={[styles.rankText, medal ? { color: "#1A140F" } : null]}>{rank}</Text>
      </View>
      <View style={styles.avatar}>
        {character ? <Image source={character.illustration} resizeMode="contain" style={{ width: 26, height: 26 }} /> : null}
      </View>
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={styles.name} numberOfLines={1}>
          {player.name}
        </Text>
        <View style={styles.track}>
          <Animated.View style={[styles.bar, { backgroundColor: highlight ? accent : "rgba(255,255,255,0.45)" }, barStyle]} />
        </View>
      </View>
      <Text style={styles.score}>{score}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  rank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  rankText: { fontFamily: "Urbanist_700Bold", fontSize: 12, color: "rgba(255,255,255,0.8)" },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  name: { fontFamily: "Urbanist_700Bold", fontSize: 15, color: "#FFFFFF" },
  track: { height: 5, borderRadius: 3, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.08)" },
  bar: { height: "100%", borderRadius: 3 },
  score: { minWidth: 28, textAlign: "right", fontFamily: "Urbanist_700Bold", fontSize: 20, color: "#FFFFFF" },
});
