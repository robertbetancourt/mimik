import type { LucideIcon } from "lucide-react-native";
import { Pressable, Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface PrimaryButtonProps {
  label: string;
  icon?: LucideIcon;
  disabled?: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PrimaryButton({ label, icon: Icon, disabled, onPress }: PrimaryButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 100 });
      }}
      style={animatedStyle}
      className={`flex-row items-center justify-center gap-2 rounded-full bg-primary py-4 ${
        disabled ? "opacity-40" : ""
      }`}
    >
      {Icon ? <Icon size={20} color="white" /> : null}
      <Text className="font-sans-bold text-base text-white">{label}</Text>
    </AnimatedPressable>
  );
}
