import { Image, Text, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

import { getCharacterById } from "@/features/players/characters";
import { cardShadow } from "@/theme/shadow";
import type { Player } from "@/types/player";

interface PlayerRankRowProps {
  rank: number;
  player: Player;
  score: number;
}

export function PlayerRankRow({ rank, player, score }: PlayerRankRowProps) {
  const character = getCharacterById(player.characterId);

  return (
    <Animated.View
      layout={LinearTransition.duration(280)}
      style={cardShadow}
      className="flex-row items-center gap-3 rounded-2xl bg-surface p-2.5"
    >
      <Text className="w-5 text-center font-sans-bold text-sm text-ink/40">{rank}</Text>
      <View className="h-9 w-9 items-center justify-center rounded-full bg-background">
        {character ? (
          <Image source={character.illustration} resizeMode="contain" style={{ width: 24, height: 24 }} />
        ) : null}
      </View>
      <Text className="flex-1 font-sans-bold text-sm text-ink" numberOfLines={1}>
        {player.name}
      </Text>
      <Text className="font-sans-bold text-base text-ink">{score}</Text>
    </Animated.View>
  );
}
