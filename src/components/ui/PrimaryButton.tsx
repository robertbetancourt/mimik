import * as Haptics from "expo-haptics";
import type { LucideIcon } from "lucide-react-native";
import { Pressable, Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

interface PrimaryButtonProps {
  label: string;
  icon?: LucideIcon;
  disabled?: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SPRING_CONFIG = { damping: 14, stiffness: 260 };

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
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.96, SPRING_CONFIG);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_CONFIG);
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
