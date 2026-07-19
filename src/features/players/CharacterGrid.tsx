import * as Haptics from "expo-haptics";
import { Image, Pressable } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
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
      style={animatedStyle}
      className={`w-[22%] items-center justify-center rounded-2xl border-2 py-2 ${
        selected ? "border-primary bg-primary/10" : "border-transparent bg-surface"
      }`}
    >
      <Image source={character.illustration} resizeMode="contain" style={{ width: 40, height: 40 }} />
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
