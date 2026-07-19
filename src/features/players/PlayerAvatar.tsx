import { Image, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ZoomIn,
} from "react-native-reanimated";

import { getCharacterById } from "@/features/players/characters";
import type { Player } from "@/types/player";

interface PlayerAvatarProps {
  player: Player;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SPRING_CONFIG = { damping: 14, stiffness: 260 };

export function PlayerAvatar({ player, onPress }: PlayerAvatarProps) {
  const character = getCharacterById(player.characterId);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      layout={LinearTransition.duration(140).easing(Easing.out(Easing.cubic))}
      entering={ZoomIn.duration(130)
        .delay(130)
        .easing(Easing.out(Easing.back(1.4)))}
      exiting={FadeOut.duration(120)}
      className="w-[22%] items-center"
    >
      <AnimatedPressable
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.92, SPRING_CONFIG);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING_CONFIG);
        }}
        style={animatedStyle}
        className="items-center"
      >
        <View className="h-16 w-16 items-center justify-center rounded-full bg-surface">
          {character ? (
            <Image source={character.illustration} resizeMode="contain" style={{ width: 44, height: 44 }} />
          ) : null}
        </View>
        <Text className="mt-1 font-sans-bold text-xs text-ink" numberOfLines={1}>
          {player.name}
        </Text>
      </AnimatedPressable>
    </Animated.View>
  );
}
