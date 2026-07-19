import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface ChipOption<T extends string | number> {
  label: string;
  value: T;
}

interface ChipSelectorProps<T extends string | number> {
  label: string;
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SPRING_CONFIG = { damping: 14, stiffness: 260 };

const SURFACE_COLOR = "#FFF7ED";
const PRIMARY_COLOR = "#FF7A45";

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const selectedProgress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    selectedProgress.value = withTiming(selected ? 1 : 0, { duration: 180 });
  }, [selected, selectedProgress]);

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(selectedProgress.value, [0, 1], [SURFACE_COLOR, PRIMARY_COLOR]),
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(selectedProgress.value, [0, 1], ["#2B211899", "#FFFFFF"]),
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
        scale.value = withSpring(0.94, SPRING_CONFIG);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_CONFIG);
      }}
      style={[containerStyle, { flex: 1 }]}
      className="items-center rounded-full px-3 py-2"
    >
      <Animated.Text
        style={[{ fontFamily: "Urbanist_700Bold", fontSize: 14 }, textStyle]}
      >
        {label}
      </Animated.Text>
    </AnimatedPressable>
  );
}

export function ChipSelector<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: ChipSelectorProps<T>) {
  return (
    <View className="rounded-3xl bg-surface px-5 py-4">
      <Text className="font-sans-bold text-base text-ink">{label}</Text>

      <View className="mt-3 flex-row gap-2">
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={option.value === value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </View>
  );
}
