import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import type { LucideIcon } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { buttonShadow } from "@/theme/shadow";

interface PrimaryButtonProps {
  label: string;
  /** "ink" (default) for the warm screens, "accent" for the dark stage. */
  tone?: "ink" | "accent";
  icon?: LucideIcon;
  disabled?: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SPRING_CONFIG = { damping: 14, stiffness: 260 };

const GRADIENTS = {
  ink: ["#3D2F23", "#2B2118", "#1A140F"],
  accent: ["#FF9A6B", "#FF7A45", "#F0632C"],
} as const;

export function PrimaryButton({ label, icon: Icon, disabled, onPress, tone = "ink" }: PrimaryButtonProps) {
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
      style={[animatedStyle, disabled ? undefined : buttonShadow]}
      className={`rounded-full ${disabled ? "opacity-40" : ""}`}
    >
      <View className="overflow-hidden rounded-full">
        <LinearGradient
          colors={GRADIENTS[tone]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="flex-row items-center justify-center gap-2 py-4"
        >
          {Icon ? <Icon size={20} color="white" /> : null}
          <Text className="font-sans-bold text-base text-white">{label}</Text>
        </LinearGradient>

        {/* Soft top highlight for a touch of depth — no glassmorphism. */}
        <View pointerEvents="none" className="absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-white/15" />
      </View>
    </AnimatedPressable>
  );
}
