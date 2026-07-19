import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface TimerBarProps {
  timeRemaining: number;
  totalSeconds: number;
}

const BAR_HEIGHT = 160;

export function TimerBar({ timeRemaining, totalSeconds }: TimerBarProps) {
  const progress = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(totalSeconds > 0 ? timeRemaining / totalSeconds : 0, { duration: 950 });
  }, [timeRemaining, totalSeconds, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: `${Math.max(progress.value, 0) * 100}%`,
  }));

  return (
    <View className="items-center gap-2">
      <View style={{ height: BAR_HEIGHT }} className="w-3 justify-end overflow-hidden rounded-full bg-white/10">
        <Animated.View style={[{ width: "100%", backgroundColor: "#FF7A45" }, animatedStyle]} />
      </View>
      <Text className="font-sans text-xs text-white/50">{timeRemaining}s</Text>
    </View>
  );
}
