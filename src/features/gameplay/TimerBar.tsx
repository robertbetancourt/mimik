import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface TimerBarProps {
  timeRemaining: number;
  totalSeconds: number;
}

const BAR_HEIGHT = 160;
const FADE_HEIGHT = 22;
const FILL_COLOR = "#FF7A45";
// expo-linear-gradient on Android can't parse the "transparent" CSS keyword,
// so the fade-out end has to be an explicit rgba with alpha 0.
const FILL_COLOR_TRANSPARENT = "rgba(255, 122, 69, 0)";

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
      <View style={{ height: BAR_HEIGHT }} className="w-2 justify-end overflow-hidden rounded-full bg-white/10">
        <Animated.View style={[{ width: "100%", overflow: "hidden" }, animatedStyle]}>
          {/* Soft fading cap at the depleting edge, moves with the fill since it's anchored to its top. */}
          <LinearGradient
            colors={[FILL_COLOR_TRANSPARENT, FILL_COLOR]}
            style={{ height: FADE_HEIGHT, width: "100%" }}
          />
          <View style={{ flex: 1, backgroundColor: FILL_COLOR }} />
        </Animated.View>
      </View>
      <Text className="font-sans text-xs text-white/50">{timeRemaining}s</Text>
    </View>
  );
}
