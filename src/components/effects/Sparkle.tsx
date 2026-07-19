import { useEffect } from "react";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

interface SparkleProps {
  size?: number;
  color?: string;
  style?: object;
  /** Very slow, almost imperceptible opacity breathing. */
  animated?: boolean;
}

// A tiny decorative accent for otherwise-empty corners — never placed where
// it could compete with content.
export function Sparkle({ size = 14, color = "#FF7A45", style, animated }: SparkleProps) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    if (!animated) return;
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.28, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.55, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: animated ? opacity.value : 0.5 }));

  return (
    <Animated.Text style={[{ fontSize: size, color }, style, animatedStyle]} pointerEvents="none">
      ✦
    </Animated.Text>
  );
}
