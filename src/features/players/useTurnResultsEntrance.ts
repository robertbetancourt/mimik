import { useEffect } from "react";
import { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";

const RISE_DISTANCE = 10;
const DURATION = 200;

const CHARACTER_DELAY = 0;
const SCORE_DELAY = 70;
const DECORATION_DELAY = 220;
const COUNTERS_DELAY = 300;
const LEADERBOARD_DELAY = 420;
const BUTTON_DELAY = 540;

// Guides the player's eye top-to-bottom: who played → their score (the hero,
// the only element that gets a spring settle) → the framing decoration →
// the word breakdown → the leaderboard → finally the way forward. Nothing
// here animates per list item — long word/leaderboard lists fade in as one
// group for readability and performance.
export function useTurnResultsEntrance() {
  const characterOpacity = useSharedValue(0);
  const characterY = useSharedValue(RISE_DISTANCE);

  const scoreOpacity = useSharedValue(0);
  const scoreY = useSharedValue(RISE_DISTANCE);
  const scoreScale = useSharedValue(0.9);

  const decorationOpacity = useSharedValue(0);

  const countersOpacity = useSharedValue(0);
  const countersY = useSharedValue(RISE_DISTANCE);

  const leaderboardOpacity = useSharedValue(0);
  const leaderboardY = useSharedValue(RISE_DISTANCE);

  const buttonOpacity = useSharedValue(0);
  const buttonY = useSharedValue(RISE_DISTANCE);

  useEffect(() => {
    const easing = Easing.out(Easing.cubic);
    const fadeUp = (opacity: typeof characterOpacity, y: typeof characterY, delay: number) => {
      opacity.value = withDelay(delay, withTiming(1, { duration: DURATION, easing }));
      y.value = withDelay(delay, withTiming(0, { duration: DURATION, easing }));
    };

    fadeUp(characterOpacity, characterY, CHARACTER_DELAY);

    scoreOpacity.value = withDelay(SCORE_DELAY, withTiming(1, { duration: DURATION, easing }));
    scoreY.value = withDelay(SCORE_DELAY, withTiming(0, { duration: DURATION, easing }));
    scoreScale.value = withDelay(SCORE_DELAY, withSpring(1, { damping: 12, stiffness: 200 }));

    decorationOpacity.value = withDelay(DECORATION_DELAY, withTiming(1, { duration: 180, easing }));

    fadeUp(countersOpacity, countersY, COUNTERS_DELAY);
    fadeUp(leaderboardOpacity, leaderboardY, LEADERBOARD_DELAY);
    fadeUp(buttonOpacity, buttonY, BUTTON_DELAY);
    // Entrance is scripted to run exactly once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const characterStyle = useAnimatedStyle(() => ({
    opacity: characterOpacity.value,
    transform: [{ translateY: characterY.value }],
  }));
  const scoreStyle = useAnimatedStyle(() => ({
    opacity: scoreOpacity.value,
    transform: [{ translateY: scoreY.value }, { scale: scoreScale.value }],
  }));
  const decorationStyle = useAnimatedStyle(() => ({ opacity: decorationOpacity.value }));
  const countersStyle = useAnimatedStyle(() => ({
    opacity: countersOpacity.value,
    transform: [{ translateY: countersY.value }],
  }));
  const leaderboardStyle = useAnimatedStyle(() => ({
    opacity: leaderboardOpacity.value,
    transform: [{ translateY: leaderboardY.value }],
  }));
  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonY.value }],
  }));

  return { characterStyle, scoreStyle, decorationStyle, countersStyle, leaderboardStyle, buttonStyle };
}
