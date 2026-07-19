import { useEffect } from "react";
import { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

const HEADER_DELAY = 0;
const SETTINGS_BASE_DELAY = 90;
const SETTINGS_STAGGER = 45;
const BUTTON_DELAY = 340;
const DURATION = 220;
const RISE_DISTANCE = 10;

// Calm, staggered one-shot entrance: header → each of the 5 setting groups
// → the primary button. No springs — this screen is about confidence, not
// playfulness, so every step eases out smoothly instead of bouncing.
export function useMatchSettingsEntrance() {
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(RISE_DISTANCE);

  const opacity0 = useSharedValue(0);
  const y0 = useSharedValue(RISE_DISTANCE);
  const opacity1 = useSharedValue(0);
  const y1 = useSharedValue(RISE_DISTANCE);
  const opacity2 = useSharedValue(0);
  const y2 = useSharedValue(RISE_DISTANCE);
  const opacity3 = useSharedValue(0);
  const y3 = useSharedValue(RISE_DISTANCE);
  const opacity4 = useSharedValue(0);
  const y4 = useSharedValue(RISE_DISTANCE);

  const buttonOpacity = useSharedValue(0);
  const buttonY = useSharedValue(RISE_DISTANCE);

  useEffect(() => {
    const easing = Easing.out(Easing.cubic);
    const fadeUp = (opacity: typeof opacity0, y: typeof y0, delay: number) => {
      opacity.value = withDelay(delay, withTiming(1, { duration: DURATION, easing }));
      y.value = withDelay(delay, withTiming(0, { duration: DURATION, easing }));
    };

    fadeUp(headerOpacity, headerY, HEADER_DELAY);
    fadeUp(opacity0, y0, SETTINGS_BASE_DELAY + 0 * SETTINGS_STAGGER);
    fadeUp(opacity1, y1, SETTINGS_BASE_DELAY + 1 * SETTINGS_STAGGER);
    fadeUp(opacity2, y2, SETTINGS_BASE_DELAY + 2 * SETTINGS_STAGGER);
    fadeUp(opacity3, y3, SETTINGS_BASE_DELAY + 3 * SETTINGS_STAGGER);
    fadeUp(opacity4, y4, SETTINGS_BASE_DELAY + 4 * SETTINGS_STAGGER);
    fadeUp(buttonOpacity, buttonY, BUTTON_DELAY);
    // Entrance is scripted to run exactly once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));
  const settingStyle0 = useAnimatedStyle(() => ({
    opacity: opacity0.value,
    transform: [{ translateY: y0.value }],
  }));
  const settingStyle1 = useAnimatedStyle(() => ({
    opacity: opacity1.value,
    transform: [{ translateY: y1.value }],
  }));
  const settingStyle2 = useAnimatedStyle(() => ({
    opacity: opacity2.value,
    transform: [{ translateY: y2.value }],
  }));
  const settingStyle3 = useAnimatedStyle(() => ({
    opacity: opacity3.value,
    transform: [{ translateY: y3.value }],
  }));
  const settingStyle4 = useAnimatedStyle(() => ({
    opacity: opacity4.value,
    transform: [{ translateY: y4.value }],
  }));
  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonY.value }],
  }));

  return {
    headerStyle,
    settingStyles: [settingStyle0, settingStyle1, settingStyle2, settingStyle3, settingStyle4],
    buttonStyle,
  };
}
