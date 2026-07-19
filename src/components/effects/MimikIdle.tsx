import { useEffect, useRef } from "react";
import { Image } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface MimikIdleProps {
  source: number;
  size: number;
}

const TILT_INTERVAL_MS = 5000;
const TILT_CHANCE = 0.5;

// Gentle breathing (continuous, worklet-driven — no JS timer) plus an
// occasional tiny head tilt. No jumping, no exaggerated looping.
export function MimikIdle({ source, size }: MimikIdleProps) {
  const breathe = useSharedValue(1);
  const tilt = useSharedValue(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );

    function scheduleTilt() {
      timeoutRef.current = setTimeout(() => {
        if (Math.random() < TILT_CHANCE) {
          const direction = Math.random() < 0.5 ? -1 : 1;
          tilt.value = withSequence(
            withTiming(direction * 3, { duration: 260, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 320, easing: Easing.inOut(Easing.quad) }),
          );
        }
        scheduleTilt();
      }, TILT_INTERVAL_MS);
    }
    scheduleTilt();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }, { rotate: `${tilt.value}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <Image source={source} resizeMode="contain" style={{ width: size, height: size }} />
    </Animated.View>
  );
}
