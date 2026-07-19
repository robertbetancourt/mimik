import * as Haptics from "expo-haptics";
import { Pressable, type PressableProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

interface IconButtonProps extends Pick<PressableProps, "disabled"> {
  onPress: () => void;
  className?: string;
  children: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SPRING_CONFIG = { damping: 14, stiffness: 260 };

export function IconButton({ onPress, disabled, className, children }: IconButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.88, SPRING_CONFIG);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_CONFIG);
      }}
      style={animatedStyle}
      className={`items-center justify-center rounded-full ${disabled ? "opacity-30" : ""} ${className ?? ""}`}
    >
      {children}
    </AnimatedPressable>
  );
}
