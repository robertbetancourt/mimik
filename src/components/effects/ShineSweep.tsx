import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface ShineSweepProps {
  enabled: boolean;
  width: number;
  height: number;
  children: React.ReactNode;
}

const SWEEP_DURATION_MS = 700;

// A single, thin highlight sweep across the trophy — sync point: fires once,
// right after the winner has settled (enabled flips true then). No loop.
export function ShineSweep({ enabled, width, height, children }: ShineSweepProps) {
  const progress = useSharedValue(0);
  const hasSweptRef = useRef(false);

  useEffect(() => {
    if (!enabled || hasSweptRef.current) return;
    hasSweptRef.current = true;

    progress.value = withTiming(1, { duration: SWEEP_DURATION_MS });
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
