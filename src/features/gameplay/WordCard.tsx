import { useEffect } from "react";
import { Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

interface WordCardProps {
  word: string;
}

function getFontSize(word: string): number {
  if (word.length <= 6) return 128;
  if (word.length <= 10) return 100;
  if (word.length <= 14) return 78;
  return 58;
}

export function WordCard({ word }: WordCardProps) {
  const translateY = useSharedValue(28);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    // Slide up from below with a small overshoot before settling — plays
    // on every new word, including the very first one after the countdown.
    translateY.value = 28;
    opacity.value = 0;
    scale.value = 0.9;

    translateY.value = withSequence(withTiming(-6, { duration: 160 }), withTiming(0, { duration: 110 }));
    opacity.value = withTiming(1, { duration: 160 });
    scale.value = withSequence(withTiming(1.08, { duration: 160 }), withTiming(1, { duration: 110 }));
  }, [word, translateY, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Text
        className="text-center font-sans-bold text-white"
        style={{ fontSize: getFontSize(word) }}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        {word}
      </Text>
    </Animated.View>
  );
}
