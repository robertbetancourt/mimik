import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Image, Pressable } from "react-native";
import Animated, {
  FadeIn,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import type { Character } from "@/features/players/characters";

interface CharacterGridProps {
  categoryId: string;
  characters: Character[];
  selectedId: string;
  onSelect: (characterId: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SPRING_CONFIG = { damping: 14, stiffness: 260 };

// Dark stage palette: glass tiles, the chosen one lit in the accent.
const SURFACE_COLOR = "rgba(255, 255, 255, 0.06)";
const SELECTED_BG = "rgba(255, 122, 69, 0.22)";
const BORDER_IDLE = "rgba(255, 255, 255, 0)";
const BORDER_SELECTED = "#FF7A45";

function CharacterOption({
  character,
  selected,
  onPress,
}: {
  character: Character;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const selectedProgress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    selectedProgress.value = withTiming(selected ? 1 : 0, { duration: 180 });
  }, [selected, selectedProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(selectedProgress.value, [0, 1], [SURFACE_COLOR, SELECTED_BG]),
    borderColor: interpolateColor(selectedProgress.value, [0, 1], [BORDER_IDLE, BORDER_SELECTED]),
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.9, SPRING_CONFIG);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_CONFIG);
      }}
      style={[animatedStyle, { borderWidth: 1.5 }]}
      className="w-[22%] items-center justify-center rounded-2xl py-2"
    >
      <Image source={character.illustration} resizeMode="contain" resizeMethod="resize" style={{ width: 40, height: 40 }} />
    </AnimatedPressable>
  );
}

export function CharacterGrid({ categoryId, characters, selectedId, onSelect }: CharacterGridProps) {
  return (
    <Animated.View
      key={categoryId}
      entering={FadeIn.duration(160)}
      className="flex-row flex-wrap gap-x-[4%] gap-y-3"
    >
      {characters.map((character) => (
        <CharacterOption
          key={character.id}
          character={character}
          selected={character.id === selectedId}
          onPress={() => onSelect(character.id)}
        />
      ))}
    </Animated.View>
  );
}
