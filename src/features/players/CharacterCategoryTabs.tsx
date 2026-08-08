import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import type { CharacterCategory } from "@/features/players/characters";

interface CharacterCategoryTabsProps {
  categories: CharacterCategory[];
  selectedId: string;
  onChange: (categoryId: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SURFACE_COLOR = "#FFF7ED";
const PRIMARY_COLOR = "#2B2118";

function Tab({
  category,
  selected,
  onPress,
}: {
  category: CharacterCategory;
  selected: boolean;
  onPress: () => void;
}) {
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, { duration: 180 });
  }, [selected, progress]);

  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [SURFACE_COLOR, PRIMARY_COLOR]),
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={style}
      className="mr-2 flex-row items-center gap-1.5 rounded-full px-4 py-2"
    >
      <Text className="text-base">{category.emoji}</Text>
      <Text className={`font-sans-bold text-sm ${selected ? "text-white" : "text-ink/70"}`}>
        {category.label}
      </Text>
    </AnimatedPressable>
  );
}

export function CharacterCategoryTabs({ categories, selectedId, onChange }: CharacterCategoryTabsProps) {
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerClassName="py-1 pr-6"
      >
        {categories.map((category) => (
          <Tab
            key={category.id}
            category={category}
            selected={category.id === selectedId}
            onPress={() => onChange(category.id)}
          />
        ))}
      </ScrollView>

      {/* Hints that the tab row scrolls further, without measuring overflow. */}
      <LinearGradient
        colors={["rgba(255, 247, 237, 0)", "#FFF7ED"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        pointerEvents="none"
        style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 28 }}
      />
    </View>
  );
}
