import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface ShineSweepProps {
  enabled: boolean;
  width: number;
  height: number;
  children: React.ReactNode;
}

const SWEEP_DURATION_MS = 700;
const PAUSE_MS = 3600;

// A thin, dim highlight that sweeps across the wrapped content every few
// seconds — a cheap stand-in for a real light shine, no rotation or bounce.
export function ShineSweep({ enabled, width, height, children }: ShineSweepProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!enabled) return;

    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: SWEEP_DURATION_MS }),
        withDelay(PAUSE_MS, withTiming(1, { duration: 0 })),
        withTiming(0, { duration: 0 }),
      ),
      -1,
    );
  }, [enabled, progress]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -width + progress.value * width * 2.4 }, { rotate: "18deg" }],
  }));

  return (
    <View style={{ width, height }}>
      {children}
      {enabled ? (
        <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
          <Animated.View style={[{ position: "absolute", top: -height * 0.5, width: width * 0.35, height: height * 2 }, sweepStyle]}>
            <LinearGradient
              colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.55)", "rgba(255,255,255,0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}
