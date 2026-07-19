import { useEffect } from "react";
import { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

const IDLE_INTERVAL_MS = 3500;

// Every few seconds, exactly one of the three podium characters gets a tiny
// bounce — never all at once, just enough to feel alive.
export function usePodiumIdle(enabled: boolean, slotCount: number) {
  const scaleA = useSharedValue(1);
  const scaleB = useSharedValue(1);
  const scaleC = useSharedValue(1);
  const scales = [scaleA, scaleB, scaleC];

  useEffect(() => {
    if (!enabled || slotCount === 0) return;

    const interval = setInterval(() => {
      const index = Math.floor(Math.random() * slotCount);
      const target = scales[index];
      target.value = withSequence(
        withTiming(1.08, { duration: 180 }),
        withTiming(1, { duration: 220 }),
      );
    }, IDLE_INTERVAL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, slotCount]);

  const styleA = useAnimatedStyle(() => ({ transform: [{ scale: scaleA.value }] }));
  const styleB = useAnimatedStyle(() => ({ transform: [{ scale: scaleB.value }] }));
  const styleC = useAnimatedStyle(() => ({ transform: [{ scale: scaleC.value }] }));

  return [styleA, styleB, styleC];
}
