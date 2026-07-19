import { useEffect } from "react";
import { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

const MIMIK_DELAY = 40;
const TITLE_DELAY = 100;
const DURATION = 250;
const RISE_DISTANCE = 8;

// One-shot entrance for the Home header: Mimik, then the title block. The
// category grid handles its own per-card stagger (see CategoryCard), so it
// isn't animated here too — that would double up on opacity/translate.
export function useHomeEntrance() {
  const mimikOpacity = useSharedValue(0);
  const mimikY = useSharedValue(RISE_DISTANCE);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(RISE_DISTANCE);

  useEffect(() => {
    const easing = Easing.out(Easing.cubic);

    mimikOpacity.value = withDelay(MIMIK_DELAY, withTiming(1, { duration: DURATION, easing }));
    mimikY.value = withDelay(MIMIK_DELAY, withTiming(0, { duration: DURATION, easing }));
    titleOpacity.value = withDelay(TITLE_DELAY, withTiming(1, { duration: DURATION, easing }));
    titleY.value = withDelay(TITLE_DELAY, withTiming(0, { duration: DURATION, easing }));
    // Entrance is scripted to run exactly once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mimikStyle = useAnimatedStyle(() => ({
    opacity: mimikOpacity.value,
    transform: [{ translateY: mimikY.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  return { mimikStyle, titleStyle };
}
